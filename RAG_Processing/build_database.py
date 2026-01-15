from llama_index.core import SimpleDirectoryReader, StorageContext
from llama_index.core.schema import BaseNode
from llama_index.core import VectorStoreIndex
from typing import List
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.storage.storage_context import StorageContext
import chromadb


def buildDB(chunks: List[BaseNode],database_name: str):

    embedding = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

    for chunk in chunks:
        chunk.embedding= embedding.get_text_embedding(chunk.text)
    

    chroma_cl = chromadb.Client()
    collection = chroma_cl.get_or_create_collection(name= database_name)

    chroma_store = ChromaVectorStore(chroma_collection=collection)
    storage_location = StorageContext.from_defaults(vector_store=chroma_store)

    idx = VectorStoreIndex(chunks,storage_context=storage_location,embed_model= embedding)

    return idx

