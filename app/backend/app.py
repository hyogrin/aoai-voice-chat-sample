import logging
import os
from pathlib import Path

from aiohttp import web
from azure.core.credentials import AzureKeyCredential
from azure.identity import AzureDeveloperCliCredential, DefaultAzureCredential
from dotenv import load_dotenv

from ragtools import attach_rag_tools
from rtmt import RTMiddleTier

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voicerag")

async def create_app():
    load_dotenv(override=True)
    
    voice_model_key = os.environ.get("AZURE_OPENAI_API_KEY") if os.environ.get("VOICE_MODEL_TYPE") == "aoai_realtime" else os.environ.get("AZURE_VOICEAGENT_API_KEY")
    search_key = os.environ.get("AZURE_SEARCH_API_KEY")
    custom_language = os.environ.get("CUSTOM_LANGUAGE")
    
    credential = None
    if not voice_model_key or not search_key:
        if tenant_id := os.environ.get("AZURE_TENANT_ID"):
            logger.info("Using AzureDeveloperCliCredential with tenant_id %s", tenant_id)
            credential = AzureDeveloperCliCredential(tenant_id=tenant_id, process_timeout=60)
        else:
            logger.info("Using DefaultAzureCredential")
            credential = DefaultAzureCredential()
    
    voice_model_credential = AzureKeyCredential(voice_model_key) if voice_model_key else credential
    search_credential = AzureKeyCredential(search_key) if search_key else credential
    
    app = web.Application()

    rtmt = RTMiddleTier(
        credentials=voice_model_credential,
        endpoint=os.environ["AZURE_OPENAI_ENDPOINT"] if os.environ.get("VOICE_MODEL_TYPE") == "aoai_realtime" else os.environ["AZURE_VOICEAGENT_ENDPOINT"],
        deployment=os.environ["AZURE_OPENAI_REALTIME_DEPLOYMENT"],
        api_version=os.environ.get("AZURE_OPENAI_API_VERSION") if os.environ.get("VOICE_MODEL_TYPE") == "aoai_realtime" else os.environ.get("AZURE_VOICEAGENT_API_VERSION"),
        voice_choice=os.environ.get("AZURE_OPENAI_REALTIME_VOICE_CHOICE") if os.environ.get("VOICE_MODEL_TYPE") == "aoai_realtime" else os.environ.get("AZURE_VOICEAGENT_VOICE_CHOICE"),
        voice_model_type=os.environ.get("VOICE_MODEL_TYPE") or "aoai_realtime",
        )
    
    rtmt.system_message = """
        You are a helpful assistant. Answer questions based only on information retrieved from the knowledge base using the 'search' tool.
        The user is listening to your responses, so keep answers concise and limited to a single sentence whenever possible.
        Do not read out file names, source names, or keys.

        Follow these steps strictly:
        Always use the 'search' tool to look up information before responding.
        Use the 'report_grounding' tool to reference the source.
        If the answer is not found, simply state: I don't know.
        Respond in the same language as the question.

        Special Instructions:
        When mentioning the model "X10," or "X10" always pronounce it as "X one-zero", not "ten." For example, "The X one-zero device is optimized for high-speed processing." Keep this pronunciation consistent throughout the discussion.
        Ensure this pronunciation is consistent throughout the conversation.
    """.strip()
    
    print("custom_language set to ", custom_language)
    if custom_language:
        rtmt.system_message = rtmt.system_message.replace("You are a helpful assistant.", "You are a helpful assistant that speaks in " + custom_language + ".")

    attach_rag_tools(rtmt,
        credentials=search_credential,
        search_endpoint=os.environ.get("AZURE_SEARCH_ENDPOINT"),
        search_index=os.environ.get("AZURE_SEARCH_INDEX"),
        semantic_configuration=os.environ.get("AZURE_SEARCH_SEMANTIC_CONFIGURATION") or None,
        identifier_field=os.environ.get("AZURE_SEARCH_IDENTIFIER_FIELD") or "chunk_id",
        content_field=os.environ.get("AZURE_SEARCH_CONTENT_FIELD") or "chunk",
        embedding_field=os.environ.get("AZURE_SEARCH_EMBEDDING_FIELD") or "text_vector",
        title_field=os.environ.get("AZURE_SEARCH_TITLE_FIELD") or "title",
        use_vector_query=(os.getenv("AZURE_SEARCH_USE_VECTOR_QUERY", "true") == "true")
        )

    rtmt.attach_to_app(app, "/realtime")

    current_directory = Path(__file__).parent
    app.add_routes([web.get('/', lambda _: web.FileResponse(current_directory / 'static/index.html'))])
    app.router.add_static('/', path=current_directory / 'static', name='static')
    
    return app

if __name__ == "__main__":
    host = "localhost"
    port = 8765
    web.run_app(create_app(), host=host, port=port)
