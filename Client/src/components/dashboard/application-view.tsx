import { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  getKeyValue,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";

import { useSocket } from "@/components/SocketContext";
import { StopIcon } from "@/components/icons";

export const ApplicationView = () => {
  const {
    SubscribeToApplications,
    UnsubscribeFromApplications,
    KillProcess, // Use KillProcess instead of KillApplication as per SocketContext
    ApplicationList,
    IsServerConnected,
  } = useSocket();

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (IsServerConnected) {
      SubscribeToApplications();
    }

    return () => {
      UnsubscribeFromApplications();
    };
  }, [IsServerConnected, SubscribeToApplications, UnsubscribeFromApplications]);

  const handleKillApp = (PID: number) => {
    KillProcess(PID);
  };

  const pages = Math.ceil(ApplicationList.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return ApplicationList.slice(start, end);
  }, [page, ApplicationList]);

  const columns = [
    { key: "Name", label: "APPLICATION" },
    { key: "PID", label: "PID" },
    { key: "Title", label: "TITLE" },
    { key: "Memory", label: "MEMORY" },
    { key: "actions", label: "ACTIONS" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center gap-4 w-full">
        <h2 className="text-2xl font-bold">Applications</h2>
        <div className="flex items-center gap-2">
          <span className="text-default-500 text-sm">
            Running Applications:
          </span>
          <Chip color="secondary">{ApplicationList.length}</Chip>
        </div>
      </div>

      <Table
        aria-label="Running applications table"
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
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.key}
              align={column.key === "actions" ? "center" : "start"}
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No applications running."} items={items}>
          {(item) => (
            <TableRow key={item.PID}>
              {(columnKey) => {
                if (columnKey === "actions") {
                  return (
                    <TableCell>
                      <Tooltip content="Kill Application">
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => handleKillApp(item.PID)}
                        >
                          <StopIcon />
                        </Button>
                      </Tooltip>
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
