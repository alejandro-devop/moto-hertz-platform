'use client';

import { useEffect, useState } from 'react';
import { AdminRail } from '@/components/admin/admin-rail';
import { AdminTabBar } from '@/components/admin/admin-tabbar';
import { AdminTopbar } from '@/components/admin/admin-topbar';
import { TourProvider, useTour } from '@/lib/tours/tour-provider';

const CLAVE_COLAPSO = 'admin:rail-colapsado';

/**
 * El único recorrido que no pertenece a una sección: explica el armazón, así
 * que lo pide el armazón. No pinta nada — `useTour` solo avisa al provider de
 * que este recorrido existe y que la pantalla ya está lista.
 */
function TourBienvenida() {
  useTour('panel.bienvenida');
  return null;
}

/**
 * Estructura del panel. Escritorio: barra lateral colapsable + barra superior.
 * Móvil: barra superior + barra inferior de destinos. El contenido deja abajo
 * el espacio de la barra inferior para que nada quede tapado.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  /* El colapso es una preferencia del equipo, no del servidor. */
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(CLAVE_COLAPSO) === '1');
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(CLAVE_COLAPSO, next ? '1' : '0');
      return next;
    });
  }

  return (
    /* Los recorridos guiados envuelven todo el panel: uno solo a la vez, y su
       progreso se pide una sola vez por sesión. Ver `lib/tours/`. */
    <TourProvider>
      <div className="flex min-h-dvh">
        <AdminRail collapsed={collapsed} onToggle={toggle} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 px-4 pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-6 md:pb-8">
            {children}
          </main>
        </div>
        <AdminTabBar />
      </div>
      <TourBienvenida />
    </TourProvider>
  );
}
