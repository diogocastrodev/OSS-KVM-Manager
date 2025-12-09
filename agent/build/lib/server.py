from typing import Union

from fastapi import FastAPI
import uvicorn

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

def run():
    # this is what [project.scripts] points to
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    run()