import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";

import { StartableApplication, useSocket } from "@/Components/SocketContext";
import { StopIcon } from "@/Components/Icons";

export const ApplicationView = () => {
  const {
    ApplicationList,
    StartableApplicationList,
    KillProcess,
    StartProcess,
    SubscribeToApplications,
    UnsubscribeFromApplications,
  } = useSocket();
  const [Page, SetPage] = useState(1);
  const [StartInput, SetStartInput] = useState<string>("");
  const RowsPerPage = 10;

  useEffect(() => {
    SubscribeToApplications();

    return () => {
      UnsubscribeFromApplications();
    };
  }, [SubscribeToApplications, UnsubscribeFromApplications]);

  const Pages = Math.ceil(ApplicationList.length / RowsPerPage);

  useEffect(() => {
    if (Page > Pages && Pages > 0) {
      SetPage(Pages);
    }
  }, [ApplicationList.length, Page, Pages]);

  const Items = useMemo(() => {
    const StartIndex = (Page - 1) * RowsPerPage;
    const EndIndex = StartIndex + RowsPerPage;

    return ApplicationList.slice(StartIndex, EndIndex);
  }, [Page, ApplicationList]);

  const OnStartInputChange = (Value: string) => {
    SetStartInput(Value);
  };

  const OnSelectionChange = (ID: number | null) => {
    if (ID !== null) {
      SetStartInput(StartableApplicationList[ID].Name);
    } else {
      SetStartInput(StartInput);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex justify-between items-center gap-4 w-full">
        <h2 className="text-2xl font-bold">Applications</h2>
        <div className="flex gap-4 items-center">
          <Autocomplete
            isVirtualized
            allowsCustomValue={true}
            label="Start Application"
            size="sm"
            value={StartInput}
            onInputChange={OnStartInputChange}
            onSelectionChange={OnSelectionChange}
          >
            {StartableApplicationList.map((Item: StartableApplication) => (
              <AutocompleteItem key={StartableApplicationList.indexOf(Item)}>
                {Item.Name}
              </AutocompleteItem>
            ))}
          </Autocomplete>
          <Button
            color="primary"
            isDisabled={StartInput === ""}
            size="sm"
            onPress={() => StartProcess(StartInput)}
          >
            Start
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-default-500 text-sm">
            Running Applications:
          </span>
          <Chip color="secondary">{ApplicationList.length}</Chip>
        </div>
      </div>

      <Table
        aria-label="Applications Table"
        bottomContent={
          Pages > 0 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={Page}
                total={Pages}
                onChange={(_Page) => SetPage(_Page)}
              />
            </div>
          ) : null
        }
        className="max-w-5xl"
      >
        <TableHeader>
          <TableColumn key={"PID"} align="center" width={"10%"}>
            PID
          </TableColumn>
          <TableColumn key={"Name"} align="start" width={"70%"}>
            Name
          </TableColumn>
          <TableColumn key={"Memory"} align="center" width={"10%"}>
            Memory
          </TableColumn>
          <TableColumn key={"Action"} align="center" width={"10%"}>
            Action
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No applications running."} items={Items}>
          {(item) => (
            <TableRow key={item.PID}>
              <TableCell key={item.PID}>
                <Chip
                  className="min-w-[50px]"
                  color="primary"
                  size="sm"
                  variant="flat"
                >
                  {item.PID}
                </Chip>
              </TableCell>
              <TableCell key={item.Name}>
                <div className="flex flex-col">
                  <span>{item.Name}</span>
                  <span className="text-xs text-default-500">{item.Title}</span>
                </div>
              </TableCell>
              <TableCell key={item.Memory}>{item.Memory}</TableCell>
              <TableCell>
                <Tooltip color="danger" content="Kill Process">
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => {
                      KillProcess(item.PID);
                      SetStartInput("");
                    }}
                  >
                    <StopIcon />
                  </Button>
                </Tooltip>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
