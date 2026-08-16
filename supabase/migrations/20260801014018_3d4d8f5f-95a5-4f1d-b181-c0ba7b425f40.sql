DROP POLICY "Staff can update orders" ON public.orders;
REVOKE UPDATE ON public.orders FROM authenticated;