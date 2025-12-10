import React, { useState } from "react";
import { CommandDialog, CommandInput, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";
import { Search, User, Scissors, Box } from "lucide-react";

interface SearchResult {
  type: "client" | "service" | "product";
  id: string;
  name: string;
}

interface CommandPaletteProps {
  clients: SearchResult[];
  services: SearchResult[];
  products: SearchResult[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ clients, services, products }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const results = [
    ...clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    ...services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())),
    ...products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Pesquisar clientes, serviços, produtos..."
        value={search}
        onValueChange={setSearch}
        icon={<Search />}
      />
      <CommandList>
        <CommandGroup heading="Resultados">
          {results.length === 0 && (
            <CommandItem disabled>Nenhum resultado encontrado</CommandItem>
          )}
          {results.map((item) => (
            <CommandItem key={item.type + item.id} onSelect={() => setOpen(false)}>
              {item.type === "client" && <User className="mr-2 h-4 w-4" />}
              {item.type === "service" && <Scissors className="mr-2 h-4 w-4" />}
              {item.type === "product" && <Box className="mr-2 h-4 w-4" />}
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
