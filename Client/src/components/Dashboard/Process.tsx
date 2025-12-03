import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";
import { StopIcon } from "../Icons";
import { useSocket } from "@/Components/SocketContext";

export const ProcessView = () => {
  const {
    ProcessList,
    KillProcess,
    SubscribeToProcesses,
    UnsubscribeFromProcesses,
  } = useSocket();
  const [Page, SetPage] = useState(1);
  const RowsPerPage = 10;

  useEffect(() => {
    SubscribeToProcesses();
    return () => {
      UnsubscribeFromProcesses();
    };
  }, [SubscribeToProcesses, UnsubscribeFromProcesses]);

  const Pages = Math.ceil(ProcessList.length / RowsPerPage);

  useEffect(() => {
    if (Page > Pages && Pages > 0) {
      SetPage(Pages);
    }
  }, [ProcessList.length, Page, Pages]);

  const Items = useMemo(() => {
    const StartIndex = (Page - 1) * RowsPerPage;
    const EndIndex = StartIndex + RowsPerPage;
    return ProcessList.slice(StartIndex, EndIndex);
  }, [Page, ProcessList]);

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex justify-between items-center gap-4 w-full">
        <h2 className="text-2xl font-bold">Processes</h2>
        <div className="flex items-center gap-2">
          <span className="text-default-500 text-sm">Running Processes:</span>
          <Chip color="primary">{ProcessList.length}</Chip>
        </div>
      </div>

      <Table
        aria-label="Processes Table"
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
          <TableColumn key={"PID"} align="center" width={"25%"}>
            PID
          </TableColumn>
          <TableColumn key={"Name"} align="center" width={"40%"}>
            Name
          </TableColumn>
          <TableColumn key={"Memory"} align="center" width={"25%"}>
            Memory
          </TableColumn>
          <TableColumn key={"Action"} align="center" width={"10%"}>
            Action
          </TableColumn>
        </TableHeader>
        <TableBody emptyContent={"No processes running or loading..."} items={Items}>
          {(item) => (
            <TableRow key={item.PID}>
              <TableCell key={item.PID}>
                <Chip color="primary" size="sm" variant="flat" className="min-w-[50px]">
                  {item.PID}
                </Chip>
              </TableCell>
              <TableCell key={item.Name}>{item.Name}</TableCell>
              <TableCell key={item.Memory}>{item.Memory}</TableCell>
              <TableCell>
                <Tooltip color="danger" content="Kill Process">
                  <Button
                    isIconOnly
                    color="danger"
                    size="sm"
                    variant="light"
                    onPress={() => KillProcess(item.PID)}
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
