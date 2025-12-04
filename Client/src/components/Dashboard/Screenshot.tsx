import { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { ScrollShadow } from "@heroui/scroll-shadow";

import { useSocket, Screenshot } from "@/Components/SocketContext";
import { CameraIcon } from "@/Components/Icons";

export const ScreenshotView = () => {
  const { CaptureScreenshot, IsScreenshotOn, Screenshots, IsServerConnected } =
    useSocket();
  const [SelectedFile, SetSelectedFile] = useState<Screenshot | null>(null);

  const HandleTakeScreenshot = () => {
    CaptureScreenshot();
  };

  const FormatTime = (TimeStamp: number) => {
    return new Date(TimeStamp).toLocaleString();
  };

  const FormatSize = (Bytes: number) => {
    return (Bytes / 1024).toFixed(2) + " KB";
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Screenshots</h2>
        <Button
          color="primary"
          isDisabled={!IsServerConnected}
          isLoading={IsScreenshotOn}
          startContent={!IsScreenshotOn && <CameraIcon />}
          onPress={HandleTakeScreenshot}
        >
          Take Screenshot
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden p-4 items-center justify-center">
        <Card className="w-full lg:w-1/5 h-full">
          <CardHeader className="pb-0">
            <p className="text-small text-default-500">
              {Screenshots.length} Captures
            </p>
          </CardHeader>
          <CardBody className="p-2">
            <ScrollShadow hideScrollBar className="h-full w-full">
              <div className="grid grid-cols-1 gap-2 p-2">
                {Screenshots.map((File) => (
                  <div
                    key={File.TimeStamp}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${SelectedFile?.TimeStamp === File.TimeStamp
                      ? "border-primary"
                      : "border-transparent hover:border-default-300"
                      }`}
                    onClick={() => SetSelectedFile(File)}
                  >
                    <Image
                      alt={File.TimeStamp}
                      className="object-cover w-full aspect-video"
                      radius="none"
                      src={File.URL}
                    />
                    <div className="p-1 bg-content2 text-tiny truncate">
                      {FormatTime(File.TimeStamp)}
                    </div>
                  </div>
                ))}
                {Screenshots.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-default-400">
                    No screenshots yet.
                  </div>
                )}
              </div>
            </ScrollShadow>
          </CardBody>
        </Card>

        <Card className="w-full lg:w-2/3 h-full">
          <CardBody className="flex items-center justify-center p-4">
            {SelectedFile ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                <a href={SelectedFile.URL} download={`Screenshot-${SelectedFile.TimeStamp}.png`}>
                  <Image
                    alt={SelectedFile.TimeStamp}
                    className="max-h-[calc(100vh-250px)] object-contain shadow-lg"
                    src={SelectedFile.URL}
                  />
                </a>
                <div className="flex gap-4 items-center bg-background/80 backdrop-blur-md p-2 rounded-full px-4 border border-default-200">
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">FileName</span>
                    <span className="text-small font-bold">
                      {SelectedFile.TimeStamp}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-default-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">Size</span>
                    <span className="text-small font-bold">
                      {FormatSize(SelectedFile.Size)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-default-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">Time</span>
                    <span className="text-small font-bold">
                      {FormatTime(SelectedFile.TimeStamp)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-default-400">
                <CameraIcon size={64} />
                <p className="mt-4">Select a screenshot to view</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
