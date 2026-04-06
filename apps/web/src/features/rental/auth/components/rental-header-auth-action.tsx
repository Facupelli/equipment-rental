import { Link } from "@tanstack/react-router";
import { LogOut, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCurrentCustomer } from "@/features/rental/customer/customer.queries";
import { cn } from "@/lib/utils";
import { useCustomerLogout } from "../portal-auth.queries";

export function RentalHeaderAuthAction() {
  const { data: customer } = useCurrentCustomer();

  if (!customer) {
    return (
      <Link
        to="/login"
        search={{ redirectTo: "/rental" }}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
      >
        Iniciar Sesión
      </Link>
    );
  }

  return (
    <RentalHeaderUserPopover
      fullName={customer.fullName}
      email={customer.email}
    />
  );
}

type RentalHeaderUserPopoverProps = {
  fullName: string;
  email: string;
};

function RentalHeaderUserPopover({
  fullName,
  email,
}: RentalHeaderUserPopoverProps) {
  const { mutate: logOut, isPending } = useCustomerLogout();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-neutral-200"
            aria-label="Abrir perfil"
          >
            <User className="h-5 w-5" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 gap-3 rounded-lg border border-neutral-200 bg-white "
      >
        <div>
          <p className="truncate text-sm font-semibold text-foreground">
            {fullName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <div>
          <Button
            variant="ghost"
            className="w-full px-0 justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              logOut();
            }}
            disabled={isPending}
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
