"""FastAPI backend for Churn Analysis Pipeline.

This module provides a REST API endpoint to run the churn analysis pipeline
with uploaded CSV files.

Usage:
    uvicorn api.main:app --reload --port 8000
"""

import tempfile
import os
import uuid
import threading
import requests
import pandas as pd
import re
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel
import sys
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add parent directory to path to import LLM module
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

# In-memory task storage: {task_id: {status, result, error, created_at, completed_at}}
task_storage: Dict[str, Dict[str, Any]] = {}
task_storage_lock = threading.Lock()  # Thread-safe access to task_storage

# Security: CSV upload limits
MAX_CSV_FILE_SIZE = 5 * 1024 * 1024  # 5 MB in bytes
MAX_CSV_ROWS = 15  # Maximum number of customer rows allowed

# Security: Global LLM usage counter (thread-safe, daily reset)
llm_usage_counter = 0
llm_counter_lock = threading.Lock()
llm_last_reset_date = datetime.now().date()
MAX_LLM_CALLS_PER_DAY = 49  # Block at 49, not 50

# Security: Per-IP rate limiting
rate_limit_storage: Dict[str, Dict[str, Any]] = {}
rate_limit_lock = threading.Lock()
RATE_LIMIT_REQUESTS = 10  # requests per window
RATE_LIMIT_WINDOW_SECONDS = 60  # 1 minute window

# Security: Chat input limits
MAX_CHAT_MESSAGE_LENGTH = 2000  # characters

# OpenRouter configuration
OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
MODEL_NAME = "nvidia/nemotron-3-nano-30b-a3b:free"

# Telecom chatbot system prompt
TELECOM_SYSTEM_PROMPT = """You are a telecom industry and customer retention expert assisting internal business users. Your knowledge is strictly limited to telecommunications topics including:

- Telecom devices (handsets, routers, 5G devices, compatibility)
- Mobile, broadband, and converged plans
- Churn drivers in telecom (pricing, network quality, competition, device lifecycle)
- Retention strategies and best practices
- Loyalty programs, discounts, contract strategies
- Prepaid vs postpaid dynamics
- Telecom KPIs (ARPU, churn rate, CAC, LTV)

You must:
- Provide clear, structured, business-oriented answers
- Focus on practical and explanatory content
- Be concise but informative

You must NOT answer questions about unrelated topics (coding, finance, healthcare, general knowledge, etc.). If asked about non-telecom topics, politely redirect to telecom-related subjects.

Respond only to telecom-related questions."""


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = []

app = FastAPI(
    title="Churn Analysis Pipeline API",
    description="API for running churn analysis on customer data",
    version="1.0.0"
)

# Security: Configure CORS to known frontend origins only
_frontend_url = os.environ.get("FRONTEND_URL", "").strip()
_cors_origins = (
    [_frontend_url] if _frontend_url
    else ["http://127.0.0.1:3000", "http://localhost:3000"]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_build_rag_index():
    """Build RAG index once at server startup so retrieval reuses it."""
    from LLM import init_rag_retriever
    init_rag_retriever()


# Security: Helper functions

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request, handling proxies."""
    if request.client:
        return request.client.host
    return "unknown"

def check_rate_limit(client_ip: str) -> None:
    """Check if IP has exceeded rate limit. Raises HTTPException if limit exceeded."""
    now = datetime.now()
    
    with rate_limit_lock:
        if client_ip not in rate_limit_storage:
            rate_limit_storage[client_ip] = {
                "count": 1,
                "reset_time": now + timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)
            }
            return
        
        ip_data = rate_limit_storage[client_ip]
        
        # Reset if window expired
        if now > ip_data["reset_time"]:
            ip_data["count"] = 1
            ip_data["reset_time"] = now + timedelta(seconds=RATE_LIMIT_WINDOW_SECONDS)
            return
        
        # Check limit
        if ip_data["count"] >= RATE_LIMIT_REQUESTS:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later."
            )
        
        ip_data["count"] += 1

def check_llm_limit() -> None:
    """Check if LLM usage limit reached. Raises HTTPException if limit exceeded."""
    global llm_usage_counter, llm_last_reset_date
    
    with llm_counter_lock:
        # Reset counter if new day
        today = datetime.now().date()
        if today > llm_last_reset_date:
            llm_usage_counter = 0
            llm_last_reset_date = today
        
        # Check limit (block at 49)
        if llm_usage_counter >= MAX_LLM_CALLS_PER_DAY:
            raise HTTPException(
                status_code=429,
                detail="Daily LLM usage limit reached. Please try again tomorrow."
            )

def increment_llm_usage() -> None:
    """Increment LLM usage counter after successful call."""
    global llm_usage_counter
    with llm_counter_lock:
        llm_usage_counter += 1

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal attacks."""
    # Remove path components, keep only basename
    safe_name = os.path.basename(filename)
    # Remove any remaining dangerous characters
    safe_name = re.sub(r'[^a-zA-Z0-9._-]', '_', safe_name)
    return safe_name

def sanitize_error_message(error: str) -> str:
    """Remove sensitive information from error messages."""
    # Remove file paths
    error = re.sub(r'/[^\s]+', '[path redacted]', error)
    # Remove common path patterns
    error = re.sub(r'[A-Z]:\\[^\s]+', '[path redacted]', error)
    # Remove stack trace indicators
    if 'Traceback' in error or 'File "' in error:
        return "An internal error occurred. Please try again."
    return error

def cleanup_old_tasks(max_age_hours: int = 1) -> None:
    """Remove tasks older than max_age_hours from task_storage.
    
    Args:
        max_age_hours: Maximum age in hours before tasks are cleaned up.
    """
    current_time = datetime.now()
    max_age = timedelta(hours=max_age_hours)
    
    with task_storage_lock:
        tasks_to_remove = [
            task_id for task_id, task_data in task_storage.items()
            if current_time - datetime.fromisoformat(task_data["created_at"]) > max_age
        ]
        
        for task_id in tasks_to_remove:
            del task_storage[task_id]


def execute_pipeline_wrapper(task_id: str, temp_file_path: str) -> None:
    from LLM import execute_pipeline
    # Initialize LLM counter in LLM module so it can access api.main functions
    try:
        llm_module = sys.modules.get('LLM')
        if llm_module and hasattr(llm_module, '_init_llm_counter'):
            llm_module._init_llm_counter()
    except Exception:
        pass  # Continue if initialization fails
    
    """Wrapper function to execute pipeline in background task.
    
    Args:
        task_id: Unique task identifier.
        temp_file_path: Path to temporary CSV file.
    """
    try:
        # Update status to processing
        with task_storage_lock:
            if task_id in task_storage:
                task_storage[task_id]["status"] = "processing"
        
        # Security: Check LLM limit before pipeline execution (pipeline makes LLM calls)
        check_llm_limit()
        
        # Security: Log without exposing file paths
        print(f"[DEBUG] Processing uploaded CSV file")
        if os.path.exists(temp_file_path):
            try:
                df = pd.read_csv(temp_file_path)
                print(f"[DEBUG] Uploaded CSV has {len(df)} rows")
            except Exception as e:
                print(f"[DEBUG] Error reading CSV: {sanitize_error_message(str(e))}")

        # Execute pipeline on the uploaded CSV file
        result = execute_pipeline(temp_file_path)
        
        # Debug logging for result
        if result and "customer_churn" in result:
            print(f"[DEBUG] Result contains {len(result['customer_churn'])} customers")
        
        # Store result with status "done"
        with task_storage_lock:
            if task_id in task_storage:
                task_storage[task_id]["status"] = "done"
                task_storage[task_id]["result"] = result
                task_storage[task_id]["completed_at"] = datetime.now().isoformat()
    
    except Exception as e:
        # Store error with status "failed"
        with task_storage_lock:
            if task_id in task_storage:
                task_storage[task_id]["status"] = "failed"
                task_storage[task_id]["error"] = str(e)
                task_storage[task_id]["completed_at"] = datetime.now().isoformat()
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print("Warning: Could not delete temporary file after processing")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Churn Analysis Pipeline API is running"}


@app.post("/run-pipeline")
async def run_pipeline(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
) -> JSONResponse:
    """Start the churn analysis pipeline as a background task on an uploaded CSV file.
    
    Args:
        request: FastAPI Request object for IP extraction
        background_tasks: FastAPI BackgroundTasks instance.
        file: Uploaded CSV file via multipart/form-data.
        
    Returns:
        JSON response containing:
        - task_id: Unique task identifier for polling status
        
    Raises:
        HTTPException: 400 for invalid file type, size, or row count
        HTTPException: 429 for rate limit or LLM limit exceeded
        HTTPException: 500 for server errors during file handling
    """
    # Security: Rate limiting per IP
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip)
    
    # Security: Check LLM usage limit before processing (pipeline uses LLM)
    check_llm_limit()
    
    # Security: Validate file type
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV file."
        )
    
    # Security: Sanitize filename
    safe_filename = sanitize_filename(file.filename)
    
    # Security: Read file content into memory with size limit
    content = await file.read()
    
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )
    
    # Security: Check file size (5 MB limit)
    if len(content) > MAX_CSV_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {MAX_CSV_FILE_SIZE // (1024*1024)} MB."
        )
    
    # Security: Validate CSV structure and count rows BEFORE starting pipeline
    try:
        # Parse CSV to count rows
        import io
        csv_content = io.StringIO(content.decode('utf-8'))
        df = pd.read_csv(csv_content, nrows=MAX_CSV_ROWS + 1)  # Read one extra to detect overflow
        
        # Check row count (excluding header)
        row_count = len(df)
        if row_count > MAX_CSV_ROWS:
            raise HTTPException(
                status_code=400,
                detail=f"CSV contains {row_count} rows. Maximum allowed is {MAX_CSV_ROWS} rows."
            )
        
        if row_count == 0:
            raise HTTPException(
                status_code=400,
                detail="CSV file contains no data rows."
            )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty or invalid."
        )
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=400,
            detail="Invalid CSV format. Please check your file structure."
        )
    except HTTPException:
        raise
    except Exception as e:
        # Sanitize error message
        error_msg = sanitize_error_message(str(e))
        raise HTTPException(
            status_code=400,
            detail=f"Error validating CSV file: {error_msg}"
        )
    
    # Create temporary file to store uploaded CSV
    temp_file = None
    temp_file_path = None
    
    try:
        # Create temporary file with .csv extension
        temp_file = tempfile.NamedTemporaryFile(
            mode='wb',
            delete=False,
            suffix='.csv'
        )
        temp_file_path = temp_file.name
        
        # Write validated content to temp file
        temp_file.write(content)
        temp_file.close()
        
        # Generate unique task ID
        task_id = uuid.uuid4().hex
        
        # Initialize task in storage with status "pending"
        with task_storage_lock:
            task_storage[task_id] = {
                "status": "pending",
                "created_at": datetime.now().isoformat(),
                "result": None,
                "error": None,
                "completed_at": None
            }
        
        # Add background task to execute pipeline
        background_tasks.add_task(execute_pipeline_wrapper, task_id, temp_file_path)
        
        # Clean up old tasks (non-blocking)
        background_tasks.add_task(cleanup_old_tasks, max_age_hours=1)
        
        # Return task_id immediately
        return JSONResponse(content={"task_id": task_id})
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except HTTPException:
        # Re-raise HTTP exceptions (already sanitized)
        raise
    except Exception as e:
        # Security: Sanitize error messages
        error_msg = sanitize_error_message(str(e))
        # Clean up temp file if it was created
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass
        
        raise HTTPException(
            status_code=500,
            detail="Error setting up pipeline. Please try again."
        )


@app.get("/pipeline-status/{task_id}")
async def get_pipeline_status(task_id: str) -> JSONResponse:
    """Get the status and results of a pipeline task.
    
    Args:
        task_id: Unique task identifier from /run-pipeline response.
        
    Returns:
        JSON response containing:
        - task_id: Task identifier
        - status: Current status ("pending", "processing", "done", "failed")
        - result: Pipeline results (only when status="done")
        - error: Error message (only when status="failed")
        - created_at: ISO timestamp of task creation
        - completed_at: ISO timestamp of completion (optional)
        
    Raises:
        HTTPException: 404 if task_id not found
    """
    with task_storage_lock:
        if task_id not in task_storage:
            raise HTTPException(
                status_code=404,
                detail=f"Task {task_id} not found"
            )
        
        task_data = task_storage[task_id].copy()
    
    # Build response based on task status
    response = {
        "task_id": task_id,
        "status": task_data["status"],
        "created_at": task_data["created_at"]
    }
    
    if task_data["completed_at"]:
        response["completed_at"] = task_data["completed_at"]
    
    if task_data["status"] == "done" and task_data["result"]:
        response["result"] = task_data["result"]
    
    if task_data["status"] == "failed" and task_data["error"]:
        response["error"] = task_data["error"]
    
    return JSONResponse(content=response)


@app.post("/chat")
async def chat(http_request: Request, request: ChatRequest) -> JSONResponse:
    """Chat endpoint for telecom domain-specific chatbot.
    
    Args:
        http_request: FastAPI Request object for IP extraction
        request: ChatRequest containing message and optional conversation_history
        
    Returns:
        JSON response containing:
        - response: LLM response text
        - conversation_history: Updated conversation history with new messages
        
    Raises:
        HTTPException: 400 for invalid request or missing message
        HTTPException: 429 for rate limit or LLM limit exceeded
        HTTPException: 500 for server errors during LLM call
    """
    # Security: Rate limiting per IP
    client_ip = get_client_ip(http_request)
    check_rate_limit(client_ip)
    
    # Security: Check LLM usage limit before making OpenRouter call
    check_llm_limit()
    
    # Security: Validate message
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )
    
    # Security: Check message length
    message = request.message.strip()
    if len(message) > MAX_CHAT_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Message exceeds maximum length of {MAX_CHAT_MESSAGE_LENGTH} characters."
        )
    
    # Security: Basic prompt injection prevention (detect system prompt attempts)
    suspicious_patterns = [
        r'ignore\s+(previous|above|all)\s+(instructions|prompts|system)',
        r'you\s+are\s+(now|a)\s+',
        r'system\s*:',
        r'<\|system\|>',
        r'\[SYSTEM\]',
    ]
    message_lower = message.lower()
    for pattern in suspicious_patterns:
        if re.search(pattern, message_lower):
            raise HTTPException(
                status_code=400,
                detail="Message contains prohibited content."
            )
    
    try:
        # Get API key from environment
        llm_key = os.getenv("LLM_KEY_1")
        if not llm_key:
            raise HTTPException(
                status_code=500,
                detail="OpenRouter API key not configured."
            )
        
        # Build messages array with system prompt and conversation history
        messages = [
            {"role": "system", "content": TELECOM_SYSTEM_PROMPT}
        ]
        
        # Add conversation history (without system prompt)
        if request.conversation_history:
            # Filter out any existing system prompts from history
            for msg in request.conversation_history:
                if msg.get("role") != "system":
                    messages.append(msg)
        
        # Add current user message (already validated and sanitized)
        messages.append({"role": "user", "content": message})
        
        # Prepare OpenRouter request
        payload = {
            "model": MODEL_NAME,
            "messages": messages
        }
        
        headers = {
            "Authorization": f"Bearer {llm_key}",
            "Content-Type": "application/json"
        }
        
        # Call OpenRouter API
        response = requests.post(
            OPENROUTER_ENDPOINT,
            headers=headers,
            json=payload,
            timeout=60  # 60 second timeout
        )
        
        # Security: Increment LLM counter after successful call
        if response.status_code == 200:
            increment_llm_usage()
        
        # Handle API errors
        if response.status_code != 200:
            # Security: Sanitize OpenRouter error messages
            try:
                error_data = response.json()
                error_detail = error_data.get("error", {}).get("message", "Unknown error from LLM service")
                # Remove any sensitive information
                error_detail = sanitize_error_message(error_detail)
            except Exception:
                error_detail = "Error communicating with LLM service"
            
            raise HTTPException(
                status_code=response.status_code if response.status_code < 500 else 500,
                detail=error_detail
            )
        
        # Extract response
        response_data = response.json()
        llm_response = response_data["choices"][0]["message"]["content"]
        
        # Build updated conversation history (for frontend state management)
        updated_history = request.conversation_history.copy() if request.conversation_history else []
        updated_history.append({"role": "user", "content": message})
        updated_history.append({"role": "assistant", "content": llm_response})
        
        # Return response
        return JSONResponse(content={
            "response": llm_response,
            "conversation_history": updated_history
        })
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Request to LLM service timed out. Please try again."
        )
    
    except requests.exceptions.RequestException as e:
        # Security: Sanitize error messages
        error_msg = sanitize_error_message(str(e))
        raise HTTPException(
            status_code=500,
            detail="Error communicating with LLM service. Please try again."
        )
    
    except Exception as e:
        # Security: Never expose internal errors
        error_msg = sanitize_error_message(str(e))
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again."
        )


if __name__ == "__main__":
    import uvicorn
    print("Starting the fastapi server")
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))

