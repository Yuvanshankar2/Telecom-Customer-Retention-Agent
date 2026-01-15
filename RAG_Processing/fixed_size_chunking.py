from typing import List
from llama_index.core.node_parser import TokenTextSplitter
from llama_index.core.schema import Document,Node

class Fixed_Chunker():
    def __init__(self) -> None:
        self.parse = TokenTextSplitter(chunk_size=100,chunk_overlap=50)
    


    def chunk_start(self,document: List[Document]) -> List[Node]:
        chunks = self.parse.get_nodes_from_documents(document)
        return chunks
