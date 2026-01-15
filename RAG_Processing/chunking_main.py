from fixed_size_chunking import Fixed_Chunker
from semantic_chunking import Semantic_Chunker
from sentence_chunking import Sentence_Chunker
from build_database import buildDB
from llama_index.core import SimpleDirectoryReader
from llama_index.core.evaluation import RetrieverEvaluator
from llama_index.core.evaluation.retrieval.metrics import Recall
import json
from bert_score import score


def recall_at_k(db,test_set,k=5):
    results_retriever = db.as_retriever(similarity_top_k=k)
    matches=0
    for query_context in test_set:
        query = query_context["query"]
        relevant_chunks = query_context["relevant_chunks"]
        results = results_retriever.retrieve(query)
        for result in results:
            precision,recall,f1 = score([result.node.get_content()]*len(relevant_chunks),relevant_chunks,lang="en",verbose=True)
            if (recall > 0.85).any():
                matches+=1
                break
    return matches/len(test_set)
    
def chunkEvaluation():
    documents= SimpleDirectoryReader(input_dir="RAG_Processing/documents").load_data()
    recall= {}
    fixed_chunker = Fixed_Chunker()
    fixed_chunks = fixed_chunker.chunk_start(documents)
    semantic_chunker = Semantic_Chunker()
    semantic_chunks = semantic_chunker.chunk_start(documents)
    sentence_chunker = Sentence_Chunker()
    sentence_chunks = sentence_chunker.chunk_start(documents)
    with open("RAG_Processing/chunking_eval.json","r") as f:
        dataset = json.load(f)
    database_index={"Fixed_Chunker":buildDB(fixed_chunks,"Fixed_Chunker"),
    "Semantic_Chunker":buildDB(semantic_chunks,"Semantic_Chunker"),
    "Sentence_Chunker":buildDB(sentence_chunks,"Sentence_Chunker")}
    for database,index in database_index.items():
        recall[database] = recall_at_k(index,dataset)
    return recall

    
recall_scores = chunkEvaluation()
for chunking_strategy,recall in recall_scores.items():
    print(f"Recall score for {chunking_strategy}: {recall}")