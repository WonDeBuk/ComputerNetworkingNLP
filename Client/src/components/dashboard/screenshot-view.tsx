import { useEffect, useState, useRef } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Image } from "@heroui/image";
import { ScrollShadow } from "@heroui/scroll-shadow";

import { useSocket, Screenshot } from "@/components/SocketContext";
import { CameraIcon } from "@/components/icons";

export const ScreenshotView = () => {
  const { CaptureScreenshot, Screenshots, ScreenshotData, IsServerConnected } =
    useSocket();

  const [selectedFile, setSelectedFile] = useState<Screenshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const previousFilesCountRef = useRef<number>(0);

  // Load media list on mount
  useEffect(() => {
    if (IsServerConnected) {
      GetScreenshots();
    }
  }, [IsServerConnected, GetScreenshots]);

  // Select the newest file when list updates if nothing is selected
  useEffect(() => {
    if (Screenshots.length > 0 && !selectedFile) {
      setSelectedFile(Screenshots[0]);
    }
  }, [Screenshots, selectedFile]);

  // Reset loading state when a new screenshot is received
  useEffect(() => {
    if (isLoading && Screenshots.length > previousFilesCountRef.current) {
      setIsLoading(false);
    }
    previousFilesCountRef.current = Screenshots.length;
  }, [Screenshots, isLoading]);

  const handleTakeScreenshot = () => {
    setIsLoading(true);
    TakeScreenshot();
    // Loading state will be reset when screenshot_ready event is received
    // (handled by the useEffect above)
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + " KB";
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Screenshots</h2>
        <Button
          color="primary"
          isDisabled={!IsServerConnected}
          isLoading={isLoading}
          startContent={!isLoading && <CameraIcon />}
          onPress={handleTakeScreenshot}
        >
          Take Screenshot
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden p-4 items-center justify-center">
        {/* Thumbnails List */}
        <Card className="w-full lg:w-1/5 h-full">
          <CardHeader className="pb-0">
            <p className="text-small text-default-500">
              {Screenshots.length} Captures
            </p>
          </CardHeader>
          <CardBody className="p-2">
            <ScrollShadow hideScrollBar className="h-full w-full">
              <div className="grid grid-cols-1 gap-2 p-2">
                {Screenshots.map((file) => (
                  <div
                    key={file.id}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all ${
                      selectedFile?.id === file.id
                        ? "border-primary"
                        : "border-transparent hover:border-default-300"
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <Image
                      alt={file.filename}
                      className="object-cover w-full aspect-video"
                      radius="none"
                      src={file.url}
                    />
                    <div className="p-1 bg-content2 text-tiny truncate">
                      {formatTime(file.timestamp)}
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

        {/* Preview Area */}
        <Card className="w-full lg:w-2/3 h-full">
          <CardBody className="flex items-center justify-center p-4">
            {selectedFile ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                <Image
                  alt={selectedFile.filename}
                  className="max-h-[calc(100vh-250px)] object-contain shadow-lg"
                  src={selectedFile.url}
                />
                <div className="flex gap-4 items-center bg-background/80 backdrop-blur-md p-2 rounded-full px-4 border border-default-200">
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">FILENAME</span>
                    <span className="text-small font-bold">
                      {selectedFile.filename}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-default-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">SIZE</span>
                    <span className="text-small font-bold">
                      {formatSize(selectedFile.size)}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-default-300" />
                  <div className="flex flex-col items-center">
                    <span className="text-tiny text-default-500">TIME</span>
                    <span className="text-small font-bold">
                      {formatTime(selectedFile.timestamp)}
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
