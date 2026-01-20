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
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from pydantic import BaseModel
import sys
from dotenv import load_dotenv

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add parent directory to path to import LLM module
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

# In-memory task storage: {task_id: {status, result, error, created_at, completed_at}}
task_storage: Dict[str, Dict[str, Any]] = {}
task_storage_lock = threading.Lock()  # Thread-safe access to task_storage

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

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://127.0.0.1:8000", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)


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
        
        # Prepare initial state for pipeline
        initial_state = {
            "customer_insights_values": {},
            "customer_reasons": [],
            "input_file_name": temp_file_path,
            "crewai_output": []
        }
        # Execute pipeline (existing function, no changes)
        result = execute_pipeline(initial_state)
        
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
                print(f"Warning: Could not delete temp file {temp_file_path}: {e}")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Churn Analysis Pipeline API is running"}


@app.post("/run-pipeline")
async def run_pipeline(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
) -> JSONResponse:
    """Start the churn analysis pipeline as a background task on an uploaded CSV file.
    
    Args:
        background_tasks: FastAPI BackgroundTasks instance.
        file: Uploaded CSV file via multipart/form-data.
        
    Returns:
        JSON response containing:
        - task_id: Unique task identifier for polling status
        
    Raises:
        HTTPException: 400 for invalid file type or empty file
        HTTPException: 500 for server errors during file handling
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload a CSV file."
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
        
        # Read uploaded file content and write to temp file
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty."
            )
        
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
    
    except Exception as e:
        # Handle unexpected errors during file setup
        # Clean up temp file if it was created
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception:
                pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Error setting up pipeline: {str(e)}"
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
async def chat(request: ChatRequest) -> JSONResponse:
    """Chat endpoint for telecom domain-specific chatbot.
    
    Args:
        request: ChatRequest containing message and optional conversation_history
        
    Returns:
        JSON response containing:
        - response: LLM response text
        - conversation_history: Updated conversation history with new messages
        
    Raises:
        HTTPException: 400 for invalid request or missing message
        HTTPException: 500 for server errors during LLM call
    """
    # Validate message
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
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
        
        # Add current user message
        messages.append({"role": "user", "content": request.message.strip()})
        
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
        
        # Handle API errors
        if response.status_code != 200:
            error_detail = response.json().get("error", {}).get("message", "Unknown error from OpenRouter")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenRouter API error: {error_detail}"
            )
        
        # Extract response
        response_data = response.json()
        llm_response = response_data["choices"][0]["message"]["content"]
        
        # Build updated conversation history (for frontend state management)
        updated_history = request.conversation_history.copy() if request.conversation_history else []
        updated_history.append({"role": "user", "content": request.message.strip()})
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
        raise HTTPException(
            status_code=500,
            detail=f"Error communicating with LLM service: {str(e)}"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    print("Starting the fastapi server")
    uvicorn.run(app, host="127.0.0.1", port=8000)
