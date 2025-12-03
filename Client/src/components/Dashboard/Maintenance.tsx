import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";

export const MaintenanceView = ({ feature }: { feature: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col items-center gap-4 py-8">
          <h2 className="text-2xl font-bold">{feature}</h2>
          <Chip color="warning" size="lg" variant="dot">
            In Maintenance
          </Chip>
          <p className="text-default-500 text-center">
            This feature is currently under development. Please check back
            later.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};
