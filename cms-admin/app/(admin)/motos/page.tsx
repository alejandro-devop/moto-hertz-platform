"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { graphqlClient } from "@/lib/graphql-client";
import {
  MOTORCYCLES_QUERY,
  MOTORCYCLE_ADD_MUTATION,
  MOTORCYCLE_EDIT_MUTATION,
  MOTORCYCLE_REMOVE_MUTATION,
  type Motorcycle,
  type MotorcycleFormInput,
  type MotorcyclesQueryResult,
} from "@/lib/graphql/motorcycles";
import { MotorcycleFormDialog } from "./motorcycle-form-dialog";

const MOTORCYCLES_KEY = ["motorcycles"];

export default function MotosPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Motorcycle | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: MOTORCYCLES_KEY,
    queryFn: () =>
      graphqlClient.request<MotorcyclesQueryResult>(MOTORCYCLES_QUERY, {
        page: 1,
        limit: 100,
      }),
  });

  const addMutation = useMutation({
    mutationFn: (input: MotorcycleFormInput) =>
      graphqlClient.request(MOTORCYCLE_ADD_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOTORCYCLES_KEY });
      toast.success("Moto creada");
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: (input: MotorcycleFormInput & { id: string }) =>
      graphqlClient.request(MOTORCYCLE_EDIT_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOTORCYCLES_KEY });
      toast.success("Moto actualizada");
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) =>
      graphqlClient.request(MOTORCYCLE_REMOVE_MUTATION, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MOTORCYCLES_KEY });
      toast.success("Moto eliminada");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleEdit(motorcycle: Motorcycle) {
    setEditing(motorcycle);
    setDialogOpen(true);
  }

  function handleDelete(motorcycle: Motorcycle) {
    if (confirm(`¿Eliminar "${motorcycle.name}"? Esta acción no se puede deshacer.`)) {
      removeMutation.mutate(motorcycle.id);
    }
  }

  async function handleSubmit(input: MotorcycleFormInput) {
    if (editing) {
      await editMutation.mutateAsync({ ...input, id: editing.id });
    } else {
      await addMutation.mutateAsync(input);
    }
  }

  const motorcycles = data?.motorcycles.motorcycles ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Motos</h1>
          <p className="text-sm text-muted-foreground">
            {data
              ? `${data.motorcycles.total} modelos en catálogo`
              : isError
                ? "No se pudo cargar el catálogo"
                : "Cargando catálogo..."}
          </p>
        </div>
        <Button onClick={handleCreate}>Nueva moto</Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Cargando...</p>}
      {isError && <p className="text-destructive">Error al cargar el catálogo.</p>}

      {!isLoading && !isError && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {motorcycles.map((motorcycle) => (
              <TableRow key={motorcycle.id}>
                <TableCell className="font-medium">{motorcycle.name}</TableCell>
                <TableCell>{motorcycle.category || "—"}</TableCell>
                <TableCell>
                  {motorcycle.price ? `${motorcycle.price} ${motorcycle.currency}` : "—"}
                </TableCell>
                <TableCell className="flex gap-2">
                  <Badge variant={motorcycle.available ? "default" : "secondary"}>
                    {motorcycle.available ? "Disponible" : "No disponible"}
                  </Badge>
                  {motorcycle.featured && <Badge variant="outline">Destacada</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(motorcycle)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(motorcycle)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {motorcycles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No hay motos registradas todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <MotorcycleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        motorcycle={editing}
        onSubmit={handleSubmit}
        submitting={addMutation.isPending || editMutation.isPending}
      />
    </div>
  );
}
