-- Database Schema for Logistics Platform


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: carriers_verification_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.carriers_verification_status_enum AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);




--
-- Name: documents_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.documents_status_enum AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);




--
-- Name: documents_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.documents_type_enum AS ENUM (
    'PASSPORT',
    'LICENSE',
    'INSURANCE',
    'POA',
    'CMR',
    'OTHER'
);




--
-- Name: shipments_status_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.shipments_status_enum AS ENUM (
    'OPEN',
    'OFFERED',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED'
);




--
-- Name: users_role_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.users_role_enum AS ENUM (
    'SHIPPER',
    'CARRIER',
    'ADMIN'
);




--
-- Name: vehicles_type_enum; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.vehicles_type_enum AS ENUM (
    'VAN',
    'TRUCK',
    'TRAILER',
    'SPRINTER',
    'REFRIGERATED',
    'PLATFORM',
    'TANKER',
    'CONTAINER'
);








--
-- Name: carriers; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.carriers (
    user_id uuid NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    company_name character varying,
    tax_id character varying,
    passport_number character varying NOT NULL,
    passport_date_of_issue timestamp without time zone,
    verification_status public.carriers_verification_status_enum DEFAULT 'PENDING'::public.carriers_verification_status_enum NOT NULL,
    bank_name character varying,
    bank_code character varying,
    bank_account character varying,
    currency character varying,
    address_line1 character varying,
    address_line2 character varying,
    city character varying,
    state character varying,
    postal_code character varying,
    country character varying,
    languages jsonb,
    driver_license_number character varying,
    id_card_number character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);




--
-- Name: documents; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    shipment_id uuid,
    type public.documents_type_enum NOT NULL,
    file_url character varying NOT NULL,
    status public.documents_status_enum DEFAULT 'PENDING'::public.documents_status_enum NOT NULL,
    expiry_date date,
    metadata jsonb
);




--
-- Name: shipments; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.shipments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shipper_id uuid NOT NULL,
    carrier_id uuid,
    pickup_lat double precision NOT NULL,
    pickup_lng double precision NOT NULL,
    pickup_address text NOT NULL,
    pickup_time timestamp without time zone,
    delivery_lat double precision NOT NULL,
    delivery_lng double precision NOT NULL,
    delivery_address text NOT NULL,
    delivery_time timestamp without time zone,
    cargo_type character varying NOT NULL,
    weight_kg numeric NOT NULL,
    status public.shipments_status_enum DEFAULT 'OPEN'::public.shipments_status_enum NOT NULL,
    price numeric,
    
    -- New Columns for Wizard
    internal_length numeric,
    internal_width numeric,
    internal_height numeric,
    cbm numeric,
    temperature_control boolean DEFAULT false,
    hs_code character varying,
    loading_type character varying,
    has_tir boolean DEFAULT false,
    has_cmr boolean DEFAULT false,
    has_waybill boolean DEFAULT false,
    export_declaration character varying, -- 'SHIPPER', 'TRANSPORT', 'NONE'
    shipper_details jsonb, -- { company: "...", address: "..." }
    consignee_details jsonb, -- { company: "...", address: "..." }
    value_of_goods numeric,
    value_currency character varying,
    payment_terms character varying, -- 'ON_ARRIVAL', '0-7_DAYS', '8-14_DAYS', '15-30_DAYS'
    
    created_at timestamp without time zone DEFAULT now() NOT NULL
);




--
-- Name: users; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    phone character varying NOT NULL,
    password_hash character varying NOT NULL,
    role public.users_role_enum DEFAULT 'SHIPPER'::public.users_role_enum NOT NULL,
    language character varying DEFAULT 'en'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);




--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    carrier_id uuid NOT NULL,
    type public.vehicles_type_enum NOT NULL,
    plate_number character varying NOT NULL,
    capacity_kg numeric NOT NULL,
    volume_m3 numeric NOT NULL,
    length_m numeric,
    width_m numeric,
    height_m numeric,
    is_refrigerated boolean DEFAULT false NOT NULL,
    adr_class character varying,
    features jsonb,
    vin_number character varying,
    make character varying,
    model character varying,
    production_year integer,
    country_code character varying,
    has_tir boolean DEFAULT false NOT NULL,
    has_cmr boolean DEFAULT false NOT NULL,
    has_waybill boolean DEFAULT false NOT NULL,
    loading_type character varying,
    emission_class character varying,
    trailer_plate_number character varying,
    trailer_production_date character varying,
    trailer_make character varying,
    trailer_model character varying,
    trailer_vin_number character varying,
    cargo_fixing_tools boolean DEFAULT false NOT NULL,
    photos jsonb,
    insurance_policy character varying,
    poa character varying,
    truck_id_doc character varying,
    trailer_id_doc character varying
);




--
-- Name: vehicles PK_18d8646b59304dce4af3a9e35b6; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);


--
-- Name: carriers PK_48613e1d327890584957952dd14; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carriers
    ADD CONSTRAINT "PK_48613e1d327890584957952dd14" PRIMARY KEY (user_id);


--
-- Name: shipments PK_6deda4532ac542a93eab214b564; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: documents PK_ac51aa5181ee2036f5ca482857c; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "PK_ac51aa5181ee2036f5ca482857c" PRIMARY KEY (id);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: users UQ_a000cca60bcf04454e727699490; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE (phone);


--
-- Name: vehicles FK_07940383fcc9d9347a4d06b8b03; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT "FK_07940383fcc9d9347a4d06b8b03" FOREIGN KEY (carrier_id) REFERENCES public.carriers(user_id);


--
-- Name: carriers FK_48613e1d327890584957952dd14; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.carriers
    ADD CONSTRAINT "FK_48613e1d327890584957952dd14" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shipments FK_4f17b95585cca970248ddbbf0ab; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "FK_4f17b95585cca970248ddbbf0ab" FOREIGN KEY (carrier_id) REFERENCES public.carriers(user_id);


--
-- Name: shipments FK_7e29dc7d5b5fb5bdd9914be4a19; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.shipments
    ADD CONSTRAINT "FK_7e29dc7d5b5fb5bdd9914be4a19" FOREIGN KEY (shipper_id) REFERENCES public.users(id);


--
-- Name: documents FK_888a4852e27627d1ebd8a094e98; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "FK_888a4852e27627d1ebd8a094e98" FOREIGN KEY (owner_id) REFERENCES public.carriers(user_id);


--
-- Name: documents FK_889a0f64bc98fe026477e527cfb; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT "FK_889a0f64bc98fe026477e527cfb" FOREIGN KEY (shipment_id) REFERENCES public.shipments(id);


--
-- PostgreSQL database dump complete
--



