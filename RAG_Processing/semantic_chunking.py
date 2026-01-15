from typing import List
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.schema import Document,Node

class Semantic_Chunker():
    def __init__(self) -> None:
        self.parse = SemanticSplitterNodeParser(embed_model=HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2"),breakpoint_percentile_threshold=95)
    


    def chunk_start(self,document: List[Document]) -> List[Node]:
        chunks = self.parse.get_nodes_from_documents(document)
        return chunks
    




