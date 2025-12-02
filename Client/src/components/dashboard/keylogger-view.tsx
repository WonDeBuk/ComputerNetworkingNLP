import { Card, CardBody } from "@heroui/card";

export const KeyloggerView = () => {
  return (
    <div className="flex flex-col h-full gap-4">
      <h2 className="text-2xl font-bold">KeyLogger</h2>
      <Card className="w-full h-full flex items-center justify-center">
        <CardBody className="flex items-center justify-center">
          <p className="text-2xl font-bold text-default-500">
            This feature is currently under maintenance.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};
