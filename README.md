# aoai-voice-chat-sample

This project is a simplified fork of [VoiceRAG: An Application Pattern for RAG + Voice Using Azure AI Search and the GPT-4o Realtime API for Audio](https://github.com/Azure-Samples/aisearch-openai-rag-audio). 

## Additional Features

* **Transcription History UI**: The application provides a transcription history interface, displaying the conversation history between the user and the voice models.

* **Voice Agent Integration**: It integrates with the Azure Voice Agent service to create a voice agent capable of responding to user queries in real-time with human-like speech.

* **Synthetic data based RAG (Retrieval Augmented Generation)**: The app leverages Azure AI Search to answer questions from a synthetic knowledge base. Retrieved documents are sent to the GPT-4o Realtime API or Voice Agent for response generation.

* **Instruction example for domain specific pronunciation**: The app includes examples demonstrating how to use the instruction feature of the GPT-4o Realtime API to fine-tune the pronunciation of specific words or phrases.

* **VAD(Voice Activity Detection) configuration example**: This app includes examples for configuring VAD settings for the GPT-4o Realtime API, allowing control over when the voice agent starts and stops speaking, as well as how to handle silence in the audio stream. VAD configuration for Voice Agent will be available in the next release.


### Architecture Diagram

The `RTClient` in the frontend receives the audio input, sends that to the Python backend which uses an `RTMiddleTier` object to interface with the Azure OpenAI real-time API, and includes a tool for searching Azure AI Search.

![Diagram of real-time RAG pattern](docs/RTMTPattern.png)


## Getting Started

### Local environment

1. Install the required tools:
   * [Azure Developer CLI](https://aka.ms/azure-dev/install)
   * [Node.js](https://nodejs.org/)
   * [Python >=3.11](https://www.python.org/downloads/)
      * **Important**: Python and the pip package manager must be in the path in Windows for the setup scripts to work.
      * **Important**: Ensure you can run `python --version` from console. On Ubuntu, you might need to run `sudo apt install python-is-python3` to link `python` to `python3`.
   * [Git](https://git-scm.com/downloads)


## Development server

You can run this app:

1. need to create `app/backend/.env` file with the following environment variables:

   ```shell
## Voice Model Type
VOICE_MODEL_TYPE=<choose one: aoai_realtime, voice_agent_realtime>

## Voice Agent
AZURE_VOICEAGENT_ENDPOINT=wss://
AZURE_VOICEAGENT_API_KEY=
AZURE_VOICEAGENT_VOICE_CHOICE=en-US-Aria:DragonHDLatestNeural
# for voice agent api version needs to be set as 2025-05-01-preview 
AZURE_VOICEAGENT_API_VERSION=2025-05-01-preview

## Azure Open AI
AZURE_OPENAI_ENDPOINT=wss://
AZURE_OPENAI_REALTIME_DEPLOYMENT=gpt-4o-realtime-preview
AZURE_OPENAI_REALTIME_VOICE_CHOICE=<choose one: echo, alloy, shimmer>
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
AZURE_OPENAI_EMBEDDING_MODEL=text-embedding-3-small
AZURE_OPENAI_API_VERSION=2025-04-01-preview

## Azure AI Search
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_INDEX=
AZURE_SEARCH_API_KEY=
AZURE_SEARCH_IDENTIFIER_FIELD=       # Searchable field in the index that uniquely identifies a document
AZURE_SEARCH_CONTENT_FIELD=          # content field in the index that contains the text to be searched 
AZURE_SEARCH_EMBEDDING_FIELD=        # content_vector field in the index that contains the vector representation of the content    
AZURE_SEARCH_TITLE_FIELD=            # title field in the index that contains the title of the document for grounding
AZURE_SEARCH_USE_VECTOR_QUERY=true
AZURE_SEARCH_SEMANTIC_CONFIGURATION= # Semantic configuration name in the index that contains the semantic settings
CUSTOM_LANGUAGE=English
   ```

3. Run this command to start the app:

   Linux/Mac:

   ```bash
   ./scripts/start.sh
   ```

4. The app is available on [http://localhost:8765](http://localhost:8765).

   Once the app is running, when you navigate to the URL above you should see the start screen of the app:
   ![app screenshot](images/azure-voice-chat-sample.png)

   To try out the app, click the "Start conversation button", say "Hello", and then ask a question about your data like "What is the X10 series?" "How to use the X10 series?"



## Resources

* [Blog post: VoiceRAG](https://aka.ms/voicerag)
* [Demo video: VoiceRAG](https://youtu.be/vXJka8xZ9Ko)
* [Azure OpenAI Realtime Documentation](https://github.com/Azure-Samples/aoai-realtime-audio-sdk/)