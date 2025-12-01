from langchain_core.messages import HumanMessage,AIMessage,SystemMessage
from .ai_core import chat_model

async def summarize_messages(messages):
    if not messages:
        return ""
    
    prompt = "Summarize the following conversation for memory:\n\n"
    for msg in messages:
        role = "User" if msg.role == "user" else "AI"
        prompt += f"{role} : {msg.content}\n"

    summary = chat_model.invoke([HumanMessage(content=prompt)])
    return summary.content.strip()