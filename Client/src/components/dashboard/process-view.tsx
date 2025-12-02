import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Tooltip } from "@heroui/tooltip";

import { StopIcon } from "../icons";

import { useSocket } from "@/components/SocketContext";

export const ProcessView = () => {
  const {
    ProcessList, // Use ProcessList instead of Processes
    KillProcess,
    SubscribeToProcesses,
    UnsubscribeFromProcesses,
  } = useSocket();
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Subscribe to processes on mount
  useEffect(() => {
    SubscribeToProcesses();

    return () => {
      UnsubscribeFromProcesses();
    };
  }, [SubscribeToProcesses, UnsubscribeFromProcesses]);

  const pages = Math.ceil(ProcessList.length / rowsPerPage);

  // Handle edge case: if current page > total pages, reset to last page
  useEffect(() => {
    if (page > pages && pages > 0) {
      setPage(pages);
    }
  }, [ProcessList.length, page, pages]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return ProcessList.slice(start, end);
  }, [page, ProcessList]);

  const columns = [
    { key: "PID", label: "PID" },
    { key: "Name", label: "NAME" },
    { key: "Memory", label: "MEMORY" },
    { key: "actions", label: "ACTIONS" },
  ];

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex justify-between items-center gap-4 w-full">
        <h2 className="text-2xl font-bold">Processes</h2>
        <div className="flex items-center gap-2">
          <span className="text-default-500 text-sm">Running Processes:</span>
          <Chip color="secondary">{ProcessList.length}</Chip>
        </div>
      </div>

      <Table
        aria-label="Processes Table"
        bottomContent={
          pages > 0 ? (
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={pages}
                onChange={(page) => setPage(page)}
              />
            </div>
          ) : null
        }
        className="max-w-5xl"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} align="center">
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={"No processes running or loading..."}
          items={items}
        >
          {(item) => (
            <TableRow key={item.PID}>
              {(columnKey) => {
                if (columnKey === "actions") {
                  return (
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
                  );
                } else if (columnKey === "PID") {
                  return (
                    <TableCell>
                      <Chip color="primary" size="sm" variant="flat">
                        {item.PID}
                      </Chip>
                    </TableCell>
                  );
                }

                return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
              }}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
