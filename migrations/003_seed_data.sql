INSERT INTO customers (full_name, email, city) VALUES
('Juan Perez', 'juan@example.com', 'Madrid'),
('Ana Gomez', 'ana@example.com', 'Barcelona'),
('Carlos Ruiz', 'carlos@example.com', 'Valencia'),
('Laura Torres', 'laura@example.com', 'Sevilla'),
('Luis Fernandez', 'luis@example.com', 'Bilbao')
ON CONFLICT DO NOTHING;

INSERT INTO orders (customer_id, product_name, amount, status) VALUES
(1, 'Laptop', 1200.00, 'completed'),
(1, 'Mouse', 25.00, 'completed'),
(2, 'Monitor', 300.00, 'pending'),
(3, 'Teclado', 45.00, 'completed'),
(3, 'Tablet', 400.00, 'completed'),
(4, 'Impresora', 150.00, 'pending'),
(4, 'Tinta', 30.00, 'completed'),
(5, 'Escritorio', 250.00, 'completed'),
(5, 'Silla', 120.00, 'completed'),
(2, 'Cable HDMI', 15.00, 'completed');

INSERT INTO support_tickets (customer_id, subject, priority, status) VALUES
(1, 'Problema con la pantalla del laptop', 'high', 'open'),
(2, 'Pregunta sobre envío del monitor', 'medium', 'closed'),
(3, 'Tablet no enciende', 'high', 'open'),
(4, 'Manual de impresora', 'low', 'closed'),
(5, 'Falta tornillo en silla', 'medium', 'open'),
(1, 'Reembolso de mouse', 'medium', 'open');

INSERT INTO knowledge_chunks (source, content, embedding) VALUES
('FAQ', 'Nuestra política de devolución es de 30 días.', '[0.1, 0.2, 0.3, 0.4]'),
('FAQ', 'Los envíos estándar tardan entre 3 y 5 días hábiles.', '[0.4, 0.3, 0.2, 0.1]'),
('Manual', 'Para encender la tablet mantenga presionado el botón 5 segundos.', '[0.2, 0.4, 0.1, 0.3]'),
('Blog', 'Cómo elegir el mejor monitor para trabajar desde casa.', '[0.9, 0.1, 0.1, 0.1]'),
('Políticas', 'Garantía extendida aplicable por defecto a todos los laptops.', '[0.5, 0.5, 0.2, 0.2]');
