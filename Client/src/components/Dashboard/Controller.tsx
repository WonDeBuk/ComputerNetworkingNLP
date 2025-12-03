import React from "react";
import { Card, CardBody } from "@heroui/card";

import { useSocket } from "@/Components/SocketContext";
import {
  PowerIcon,
  ArrowPathIcon,
  MoonFilledIcon,
  LockIcon,
} from "@/Components/Icons";

export const ControllerView = () => {
  const { ShutDown, Reboot, Sleep, Lock } = useSocket();

  const Actions = [
    {
      Name: "Shutdown",
      Icon: PowerIcon,
      Action: ShutDown,
      Color: "danger",
      Description: "Turn off the server",
    },
    {
      Name: "Reboot",
      Icon: ArrowPathIcon,
      Action: Reboot,
      Color: "warning",
      Description: "Restart the server",
    },
    {
      Name: "Sleep",
      Icon: MoonFilledIcon,
      Action: Sleep,
      Color: "primary",
      Description: "Put server to sleep",
    },
    {
      Name: "Lock",
      Icon: LockIcon,
      Action: Lock,
      Color: "secondary",
      Description: "Lock the workstation",
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-2xl font-bold">Controller</h2>
      <div className="flex justify-center items-center h-full">
        <div className="grid grid-cols-2 gap-2 w-128 h-128">
          {Actions.map((Item, Index) => (
            <Card
              key={Index}
              isPressable
              className={`w-full h-full flex items-center justify-center `}
              onPress={Item.Action}
            >
              <CardBody className="flex flex-col items-center justify-center gap-4">
                <div
                  className={`p-4 rounded-full bg-${Item.Color}-100 dark:bg-${Item.Color}-900/20 text-${Item.Color}-500`}
                >
                  <Item.Icon size={48} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{Item.Name}</h3>
                  <p className="text-default-500">{Item.Description}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
