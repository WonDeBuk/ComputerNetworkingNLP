import { useState, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/scroll-shadow";

import { useSocket, Webcam } from "@/Components/SocketContext";
import { CameraIcon, PlayIcon, StopIcon } from "@/Components/Icons";

export const WebcamView = () => {
  const { WebcamRecordings, RecordWebcam, IsServerConnected, IsWebcamOn } =
    useSocket();

  const [SelectedVideo, SetSelectedVideo] = useState<Webcam | null>(null);
  const [Duration, SetDuration] = useState<number>(5);
  const VideoRef = useRef<HTMLVideoElement>(null);

  const HandleRecord = () => {
    RecordWebcam(Duration);
  };

  const FormatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const FormatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Webcam</h2>
        <div className="flex gap-2 items-center">
          <input
            className="px-2 py-1 rounded border border-default-300 bg-background text-foreground w-20"
            max="60"
            min="1"
            type="number"
            value={Duration}
            onChange={(e) => SetDuration(parseInt(e.target.value))}
          />
          <span className="text-small text-default-500">seconds</span>
          <Button
            color={IsWebcamOn ? "danger" : "primary"}
            isDisabled={!IsServerConnected || IsWebcamOn}
            startContent={IsWebcamOn ? <StopIcon /> : <PlayIcon />}
            onPress={HandleRecord}
          >
            {IsWebcamOn ? "Recording..." : "Record"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden p-4 items-center justify-center">
        <Card className="w-full lg:w-1/5 h-full">
          <CardHeader className="pb-0">
            <p className="text-small text-default-500">
              {WebcamRecordings.length} Recordings
            </p>
          </CardHeader>
          <CardBody className="p-2">
            <ScrollShadow className="h-full w-full [&::-webkit-scrollbar]:hidden">
              <div className="grid grid-cols-1 gap-2 p-2">
                {WebcamRecordings.map((File) => (
                  <button
                    key={File.TimeStamp}
                    className={`flex flex-col rounded-medium border-2 overflow-hidden transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${SelectedVideo?.TimeStamp === File.TimeStamp
                        ? "border-primary"
                        : "border-transparent hover:border-default-300"
                      }`}
                    type="button"
                    onClick={() => SetSelectedVideo(File)}
                  >
                    <div className="w-full aspect-video bg-default-100 flex items-center justify-center relative">
                      <CameraIcon className="text-default-400" size={32} />
                    </div>
                    <div className="p-1 bg-content2 text-tiny truncate w-full text-left">
                      {FormatTime(File.TimeStamp)}
                    </div>
                  </button>
                ))}
                {WebcamRecordings.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-default-400">
                    No recordings yet.
                  </div>
                )}
              </div>
            </ScrollShadow>
          </CardBody>
        </Card>

        {/* Preview Area */}
        <Card className="w-full lg:w-2/3 h-full">
          <CardBody className="flex items-center justify-center p-4">
            {IsWebcamOn ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="w-full aspect-video rounded-lg bg-default-100 flex items-center justify-center animate-pulse">
                  <div className="w-4 h-4 bg-danger rounded-full animate-ping" />
                </div>
                <p className="text-danger font-bold">
                  Recording in progress...
                </p>
              </div>
            ) : SelectedVideo ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                <video
                  ref={VideoRef}
                  controls
                  className="max-h-[calc(100vh-250px)] w-full object-contain shadow-lg rounded-lg"
                  src={SelectedVideo.URL}
                >
                  <track kind="captions" />
                </video>
                <div className="flex gap-4 items-center bg-background/80 backdrop-blur-md p-2 rounded-full px-4 border border-default-200">
                  <a
                    className="flex flex-col items-center hover:text-primary transition-colors cursor-pointer"
                    download={`Webcam-${SelectedVideo.TimeStamp}.mp4`}
                    href={SelectedVideo.URL}
                  >
                    <span className="text-tiny text-default-500">FILENAME</span>
                    <span className="text-small font-bold">
                      {SelectedVideo.TimeStamp.toString() + ".mp4"}
                    </span>
                  </a>
                  <div className="w-px h-8 bg-default-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">SIZE</span>
                    <span className="text-small font-bold">
                      {FormatSize(SelectedVideo.Size)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-default-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">TIME</span>
                    <span className="text-small font-bold">
                      {FormatTime(SelectedVideo.TimeStamp)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-default-400">
                <CameraIcon size={64} />
                <p className="mt-4">Select a recording to view</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
