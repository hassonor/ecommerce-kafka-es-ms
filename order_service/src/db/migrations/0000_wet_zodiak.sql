CREATE TABLE IF NOT EXISTS "carts" (
    "id" serial PRIMARY KEY NOT NULL,
    "customer_id" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "carts_customer_id_unique" UNIQUE("customer_id")
);

CREATE TABLE IF NOT EXISTS "cart_line_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "product_id" integer NOT NULL,
    "cart_id" integer NOT NULL,
    "item_name" varchar NOT NULL,
    "variant" varchar,
    "qty" integer NOT NULL,
    "amount" numeric NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" serial PRIMARY KEY NOT NULL,
    "order_number" integer NOT NULL,
    "customer_id" integer NOT NULL,
    "amount" numeric NOT NULL,
    "status" varchar NOT NULL,
    "txn_id" varchar NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);

CREATE TABLE IF NOT EXISTS "order_line_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "item_name" varchar NOT NULL,
    "qty" integer NOT NULL,
    "amount" numeric NOT NULL,
    "order_id" integer NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cart_line_items_cart_id_carts_id_fk'
    ) THEN
        ALTER TABLE "cart_line_items" ADD CONSTRAINT "cart_line_items_cart_id_carts_id_fk"
        FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'order_line_items_order_id_orders_id_fk'
    ) THEN
        ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk"
        FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;