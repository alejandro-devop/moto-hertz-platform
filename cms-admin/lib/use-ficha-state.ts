'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * El estado de una ficha: formulario plano, sección abierta, errores por campo
 * y el cálculo de «sin guardar».
 *
 * **Por qué existe.** La Fase 0 dejó estas ~40 líneas duplicadas a propósito y
 * dejó dicho que se extraerían «cuando dos secciones más lo hayan escrito
 * igual». Al construir la tercera (Fase 3, servicios) se compararon las dos
 * copias existentes —`motos` y `puntos-de-atencion`— y resultaron idénticas
 * salvo por los nombres de las variables, una regla de derivación (qué campo
 * arrastra el slug) y una palabra del mensaje de slug duplicado. Eso es la
 * evidencia que faltaba: aquí está la pieza, y las tres fichas la usan.
 *
 * **Lo que NO se llevó.** Todo lo que sí cambia entre dominios se queda en cada
 * módulo: el mapeo `registro → formulario`, el `formToInput`, la validación
 * Zod y las secciones visibles (motos las calcula según la condición). Este
 * hook orquesta; no sabe nada del dominio.
 */

export interface ResultadoValidacion<S extends string> {
  errores: Record<string, string>;
  /** Primera sección con un error, para llevar al usuario hasta él. */
  primeraSeccion?: S;
}

export interface OpcionesFicha<F extends object, S extends string, R> {
  /** La hoja abierta o cerrada: al abrirse se recarga el formulario. */
  open: boolean;
  /** El registro que se edita, o `null` cuando se está creando. */
  registro: R | null;
  /** Sección con la que abrir (una acción de fila puede pedir una concreta). */
  seccionInicial?: S;
  seccionPorDefecto: S;
  vacio: F;
  aForm: (registro: R) => F;
  /**
   * Derivaciones del dominio al cambiar un campo: el slug que sigue al nombre
   * mientras nadie lo haya escrito a mano. Recibe el estado ya actualizado.
   */
  derivar?: (siguiente: F, campo: keyof F) => F;
  validar: (form: F) => ResultadoValidacion<S>;
  /**
   * Errores que no salen del esquema Zod porque dependen del resto de la
   * lista: hoy, el slug repetido. Se mezclan con los del esquema al guardar.
   */
  validarExtra?: (form: F) => Record<string, string>;
  /** A qué sección pertenece un campo, para saltar al primer error. */
  seccionDeCampo: (campo: string) => S | undefined;
  onSubmit: (form: F) => Promise<unknown>;
}

export function useFichaState<F extends object, S extends string, R>({
  open,
  registro,
  seccionInicial,
  seccionPorDefecto,
  vacio,
  aForm,
  derivar,
  validar,
  validarExtra,
  seccionDeCampo,
  onSubmit,
}: OpcionesFicha<F, S, R>) {
  const [form, setForm] = useState<F>(vacio);
  const [seccion, setSeccion] = useState<S>(seccionPorDefecto);
  const [errores, setErrores] = useState<Record<string, string>>({});
  /** La referencia contra la que se mide «sucio». */
  const inicial = useRef<F>(vacio);

  useEffect(() => {
    if (!open) return;
    const base = registro ? aForm(registro) : vacio;
    setForm(base);
    inicial.current = base;
    setErrores({});
    setSeccion(seccionInicial ?? seccionPorDefecto);
    /* `aForm`, `vacio` y `seccionPorDefecto` son constantes del módulo: no
       entran en las dependencias o la ficha se recargaría en cada render. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, registro, seccionInicial]);

  const sucio = JSON.stringify(form) !== JSON.stringify(inicial.current);

  /** Cambia un campo y borra su error: corregir es dejar de ver el reclamo. */
  function set<K extends keyof F>(key: K, value: F[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      return derivar ? derivar(next, key) : next;
    });
    setErrores((prev) => {
      if (!(String(key) in prev)) return prev;
      const next = { ...prev };
      delete next[String(key)];
      return next;
    });
  }

  /**
   * Guardar valida primero: si hay errores, no se envía nada y la ficha salta
   * a la pestaña del primero.
   */
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { errores: nuevos, primeraSeccion } = validar(form);
    Object.assign(nuevos, validarExtra?.(form) ?? {});
    setErrores(nuevos);

    const campos = Object.keys(nuevos);
    if (campos.length > 0) {
      setSeccion(primeraSeccion ?? seccionDeCampo(campos[0]) ?? seccion);
      return;
    }

    await onSubmit(form);
  }

  return { form, setForm, set, seccion, setSeccion, errores, setErrores, sucio, handleSubmit };
}
