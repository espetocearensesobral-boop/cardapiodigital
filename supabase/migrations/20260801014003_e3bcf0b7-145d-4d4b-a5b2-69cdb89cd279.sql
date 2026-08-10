CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text NOT NULL DEFAULT '',
  badge text,
  addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  available boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Menu is public" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  phone text,
  order_type text NOT NULL CHECK (order_type IN ('delivery','local')),
  street text,
  number text,
  complement text,
  neighborhood text,
  reference text,
  table_number text,
  payment_method text,
  change_for text,
  items jsonb NOT NULL,
  notes text,
  subtotal numeric(10,2) NOT NULL,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'recebido',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.menu_items (name, description, price, category, image_url, badge, addons, sort_order) VALUES
('Espetinho de Carne','Carne bovina suculenta na brasa, tempero especial da casa',10.00,'espetinhos','https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=600&fit=crop','Mais Vendido','[{"name":"Bacon","price":3},{"name":"Queijo","price":2.5},{"name":"Cheddar","price":3.5}]',1),
('Espetinho de Frango','Peito de frango temperado e grelhado na brasa',9.00,'espetinhos','https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=600&fit=crop',NULL,'[{"name":"Bacon","price":3},{"name":"Queijo","price":2.5}]',2),
('Espetinho Misto','Carne e frango no mesmo espeto, a melhor combinação',10.50,'espetinhos','https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=600&fit=crop',NULL,'[{"name":"Bacon","price":3},{"name":"Queijo","price":2.5}]',3),
('Picanha na Brasa','Picanha premium fatiada, 400g de pura suculência',89.90,'carnes','https://images.unsplash.com/photo-1546833998-877b37c2e5c4?w=600&h=600&fit=crop','Premium','[{"name":"Farofa Especial","price":5},{"name":"Vinagrete","price":4}]',4),
('Costela de Porco','Costela suína assada lentamente, desfiando no garfo',69.90,'carnes','https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=600&fit=crop',NULL,'[{"name":"Molho Barbecue","price":3},{"name":"Farofa","price":5}]',5),
('Coração de Frango','Corações selecionados, tempero leve e suculentos',12.00,'frango','https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=600&fit=crop','Top','[{"name":"Limão","price":1},{"name":"Pimenta","price":1.5}]',6),
('Coxinha da Asa','Coxinhas de asa crocantes por fora, macias por dentro',11.00,'frango','https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=600&fit=crop',NULL,'[{"name":"Molho Rosé","price":2}]',7),
('Queijo Coalho','Queijo coalho na brasa, clássico e irresistível',14.00,'queijos','https://images.unsplash.com/photo-1563729768-6af784d6df1d?w=600&h=600&fit=crop',NULL,'[{"name":"Orégano","price":1},{"name":"Mel","price":2}]',8),
('Medalhão de Carne','Carne envolta em bacon, recheada com queijo',16.00,'medalhoes','https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=600&fit=crop','Novo','[{"name":"Queijo Extra","price":3},{"name":"Bacon Extra","price":3.5}]',9),
('Medalhão de Frango','Frango com cream cheese envolto em bacon',15.00,'medalhoes','https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=600&fit=crop',NULL,'[{"name":"Cheddar","price":3}]',10),
('Coca-Cola 350ml','Lata gelada',6.00,'bebidas','https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&h=600&fit=crop',NULL,'[]',11),
('Guaraná Antarctica','Lata 350ml',5.50,'bebidas','https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=600&fit=crop',NULL,'[]',12),
('Batata Frita','Porção generosa, crocante e dourada',18.00,'acompanhamentos','https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&h=600&fit=crop',NULL,'[{"name":"Bacon","price":5},{"name":"Cheddar","price":4}]',13),
('Pão de Alho','Pão artesanal com manteiga de alho e ervas',8.00,'acompanhamentos','https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&h=600&fit=crop',NULL,'[]',14),
('Pudim de Leite','Pudim cremoso com calda de caramelo',12.00,'sobremesas','https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&h=600&fit=crop',NULL,'[]',15),
('Mousse de Maracujá','Mousse aerado com calda de maracujá',10.00,'sobremesas','https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop',NULL,'[]',16);