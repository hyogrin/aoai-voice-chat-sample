import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { GroundingFiles } from "@/components/ui/grounding-files";
import GroundingFileView from "@/components/ui/grounding-file-view";
import StatusMessage from "@/components/ui/status-message";
import TranscriptPanel from "@/components/ui/transcript-panel";
import useRealTime from "@/hooks/useRealtime";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import useAudioPlayer from "@/hooks/useAudioPlayer";

import { GroundingFile, ToolResult } from "./types";

import logo from "./assets/logo.svg";

function App() {
    const [isRecording, setIsRecording] = useState(false);
    const [groundingFiles, setGroundingFiles] = useState<GroundingFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<GroundingFile | null>(null);
    const [transcripts, setTranscripts] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>(() => {
        return [];
    });
    const { startSession, addUserAudio, inputAudioBufferClear } = useRealTime({
        enableInputAudioTranscription: true,
        onWebSocketOpen: () => console.log("WebSocket connection opened"),
        onWebSocketClose: () => console.log("WebSocket connection closed"),
        onWebSocketError: event => console.error("WebSocket error:", event),
        onReceivedError: message => console.error("error", message),
        onReceivedResponseAudioDelta: message => {
            isRecording && playAudio(message.delta);
        },
        onReceivedInputAudioBufferSpeechStarted: () => {
            stopAudioPlayer();
        },
        onReceivedExtensionMiddleTierToolResponse: message => {
            const result: ToolResult = JSON.parse(message.tool_result);

            const files: GroundingFile[] = result.sources.map(x => {
                return { id: x.chunk_id, name: x.title, content: x.chunk };
            });

            setGroundingFiles(prev => [...prev, ...files]);
        },
        onReceivedInputAudioTranscriptionCompleted: message => {
            const newTranscriptItem = {
                text: message.transcript,
                isUser: true,
                timestamp: new Date()
            };
            setTranscripts(prev => [...prev, newTranscriptItem]);
        },
        onReceivedResponseDone: message => {
            //content.text for voice agent || content.transcript for aoai realtime api
            const transcript = message.response.output
                .map(output => output.content?.map(content => content.text || content.transcript || "").join(" "))
                .join(" ");
            if (!transcript) return;

            const newTranscriptItem = {
                text: transcript,
                isUser: false,
                timestamp: new Date()
            };
            setTranscripts(prev => [...prev, newTranscriptItem]);
        }
    });

    const { reset: resetAudioPlayer, play: playAudio, stop: stopAudioPlayer } = useAudioPlayer();
    const { start: startAudioRecording, stop: stopAudioRecording } = useAudioRecorder({ onAudioRecorded: addUserAudio });

    const onToggleListening = async () => {
        if (!isRecording) {
            startSession();
            await startAudioRecording();
            resetAudioPlayer();

            setIsRecording(true);
        } else {
            await stopAudioRecording();
            stopAudioPlayer();
            inputAudioBufferClear();

            setIsRecording(false);
        }
    };

    const { t } = useTranslation();

    return (
        <div className="flex min-h-screen flex-col bg-blue-50 text-gray-900">
            <div className="p-4 sm:absolute sm:left-4 sm:top-4">
                <img src={logo} alt="Azure logo" className="h-16 w-16" />
            </div>
            <main className="flex flex-grow flex-row">
                <div className="flex w-2/3 flex-col items-center justify-center">
                    <h1 className="mb-8 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-4xl font-bold text-transparent md:text-7xl">
                        {t("app.title")}
                    </h1>
                    <div className="mb-4 flex flex-col items-center justify-center">
                        <Button
                            onClick={onToggleListening}
                            className={`h-12 w-60 ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-purple-500 hover:bg-purple-600"}`}
                            aria-label={isRecording ? t("app.stopRecording") : t("app.startRecording")}
                        >
                            {isRecording ? (
                                <>
                                    <MicOff className="mr-2 h-4 w-4" />
                                    {t("app.stopConversation")}
                                </>
                            ) : (
                                <>
                                    <Mic className="mr-2 h-6 w-6" />
                                </>
                            )}
                        </Button>
                        <StatusMessage isRecording={isRecording} />
                    </div>
                    <GroundingFiles files={groundingFiles} onSelected={setSelectedFile} />
                    <footer className="py-4 text-center">
                        <p>{t("app.footer")}</p>
                    </footer>
                </div>

                <div className="w-1/3">
                    <Card className="p-6">
                        <h2 className="mb-4 text-center font-semibold">Transcript History</h2>
                        <div className="h-[calc(100vh-6rem)] overflow-auto">
                            <TranscriptPanel transcripts={transcripts} />
                        </div>
                    </Card>
                </div>
            </main>

            <GroundingFileView groundingFile={selectedFile} onClosed={() => setSelectedFile(null)} />
        </div>
    );
}

export default App;
