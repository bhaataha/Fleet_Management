--
-- PostgreSQL database dump
--

\restrict noo4Km658lUXMNajYndzgE3TGprZQpffDLExSDeSFY0BADQEadiwTfSqvxQTvBx

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: billingunit; Type: TYPE; Schema: public; Owner: fleet_user
--

CREATE TYPE public.billingunit AS ENUM (
    'TON',
    'M3',
    'TRIP',
    'KM'
);


ALTER TYPE public.billingunit OWNER TO fleet_user;

--
-- Name: jobstatus; Type: TYPE; Schema: public; Owner: fleet_user
--

CREATE TYPE public.jobstatus AS ENUM (
    'PLANNED',
    'ASSIGNED',
    'ENROUTE_PICKUP',
    'LOADED',
    'ENROUTE_DROPOFF',
    'DELIVERED',
    'CLOSED',
    'CANCELED'
);


ALTER TYPE public.jobstatus OWNER TO fleet_user;

--
-- Name: statementstatus; Type: TYPE; Schema: public; Owner: fleet_user
--

CREATE TYPE public.statementstatus AS ENUM (
    'DRAFT',
    'SENT',
    'PARTIALLY_PAID',
    'PAID'
);


ALTER TYPE public.statementstatus OWNER TO fleet_user;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: fleet_user
--

CREATE TYPE public.userrole AS ENUM (
    'ADMIN',
    'DISPATCHER',
    'ACCOUNTING',
    'DRIVER'
);


ALTER TYPE public.userrole OWNER TO fleet_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO fleet_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    org_id integer NOT NULL,
    user_id integer,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    action character varying(50) NOT NULL,
    before_json json,
    after_json json,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO fleet_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.audit_logs_id_seq OWNER TO fleet_user;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name character varying(255) NOT NULL,
    vat_id character varying(50),
    contact_name character varying(255),
    phone character varying(20),
    email character varying(255),
    address text,
    payment_terms character varying(100),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.customers OWNER TO fleet_user;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customers_id_seq OWNER TO fleet_user;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: delivery_notes; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.delivery_notes (
    id integer NOT NULL,
    job_id integer NOT NULL,
    note_number character varying(50),
    receiver_name character varying(255) NOT NULL,
    receiver_signature_file_id integer NOT NULL,
    delivered_at timestamp with time zone DEFAULT now(),
    notes text
);


ALTER TABLE public.delivery_notes OWNER TO fleet_user;

--
-- Name: delivery_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.delivery_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.delivery_notes_id_seq OWNER TO fleet_user;

--
-- Name: delivery_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.delivery_notes_id_seq OWNED BY public.delivery_notes.id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.drivers (
    id integer NOT NULL,
    org_id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    license_type character varying(20),
    license_expiry timestamp with time zone,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.drivers OWNER TO fleet_user;

--
-- Name: drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.drivers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.drivers_id_seq OWNER TO fleet_user;

--
-- Name: drivers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.drivers_id_seq OWNED BY public.drivers.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    org_id integer NOT NULL,
    category character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    expense_date timestamp with time zone NOT NULL,
    vendor_name character varying(255),
    truck_id integer,
    driver_id integer,
    job_id integer,
    file_id integer,
    note text,
    created_by integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.expenses OWNER TO fleet_user;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.expenses_id_seq OWNER TO fleet_user;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.files (
    id integer NOT NULL,
    org_id integer NOT NULL,
    storage_key character varying(500) NOT NULL,
    filename character varying(255) NOT NULL,
    mime_type character varying(100),
    size integer,
    uploaded_by integer,
    uploaded_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.files OWNER TO fleet_user;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.files_id_seq OWNER TO fleet_user;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: job_files; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.job_files (
    id integer NOT NULL,
    job_id integer NOT NULL,
    file_id integer NOT NULL,
    file_type character varying(50),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.job_files OWNER TO fleet_user;

--
-- Name: job_files_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.job_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_files_id_seq OWNER TO fleet_user;

--
-- Name: job_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.job_files_id_seq OWNED BY public.job_files.id;


--
-- Name: job_status_events; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.job_status_events (
    id integer NOT NULL,
    job_id integer NOT NULL,
    status public.jobstatus NOT NULL,
    event_time timestamp with time zone DEFAULT now(),
    user_id integer,
    lat numeric(10,7),
    lng numeric(10,7),
    note text
);


ALTER TABLE public.job_status_events OWNER TO fleet_user;

--
-- Name: job_status_events_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.job_status_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.job_status_events_id_seq OWNER TO fleet_user;

--
-- Name: job_status_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.job_status_events_id_seq OWNED BY public.job_status_events.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    org_id integer NOT NULL,
    customer_id integer NOT NULL,
    from_site_id integer NOT NULL,
    to_site_id integer NOT NULL,
    material_id integer NOT NULL,
    scheduled_date timestamp with time zone NOT NULL,
    priority integer,
    driver_id integer,
    truck_id integer,
    trailer_id integer,
    planned_qty numeric(10,2) NOT NULL,
    actual_qty numeric(10,2),
    unit public.billingunit NOT NULL,
    status public.jobstatus,
    pricing_total numeric(10,2),
    pricing_breakdown_json json,
    manual_override_total numeric(10,2),
    manual_override_reason text,
    notes text,
    is_billable boolean,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.jobs OWNER TO fleet_user;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.jobs_id_seq OWNER TO fleet_user;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: materials; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    org_id integer NOT NULL,
    name character varying(255) NOT NULL,
    name_hebrew character varying(255),
    billing_unit public.billingunit NOT NULL,
    density numeric(5,2),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.materials OWNER TO fleet_user;

--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.materials_id_seq OWNER TO fleet_user;

--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: payment_allocations; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.payment_allocations (
    id integer NOT NULL,
    payment_id integer NOT NULL,
    statement_id integer NOT NULL,
    amount numeric(10,2) NOT NULL
);


ALTER TABLE public.payment_allocations OWNER TO fleet_user;

--
-- Name: payment_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.payment_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payment_allocations_id_seq OWNER TO fleet_user;

--
-- Name: payment_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.payment_allocations_id_seq OWNED BY public.payment_allocations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    org_id integer NOT NULL,
    customer_id integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    paid_at timestamp with time zone NOT NULL,
    method character varying(50),
    reference character varying(100),
    created_by integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.payments OWNER TO fleet_user;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.payments_id_seq OWNER TO fleet_user;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: price_lists; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.price_lists (
    id integer NOT NULL,
    org_id integer NOT NULL,
    customer_id integer,
    material_id integer NOT NULL,
    from_site_id integer,
    to_site_id integer,
    unit public.billingunit NOT NULL,
    base_price numeric(10,2) NOT NULL,
    min_charge numeric(10,2),
    wait_fee_per_hour numeric(10,2),
    night_surcharge_pct numeric(5,2),
    valid_from timestamp with time zone NOT NULL,
    valid_to timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.price_lists OWNER TO fleet_user;

--
-- Name: price_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.price_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.price_lists_id_seq OWNER TO fleet_user;

--
-- Name: price_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.price_lists_id_seq OWNED BY public.price_lists.id;


--
-- Name: sites; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.sites (
    id integer NOT NULL,
    org_id integer NOT NULL,
    customer_id integer NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    lat numeric(10,7),
    lng numeric(10,7),
    opening_hours character varying(255),
    access_notes text,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.sites OWNER TO fleet_user;

--
-- Name: sites_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.sites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sites_id_seq OWNER TO fleet_user;

--
-- Name: sites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.sites_id_seq OWNED BY public.sites.id;


--
-- Name: statement_lines; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.statement_lines (
    id integer NOT NULL,
    statement_id integer NOT NULL,
    job_id integer NOT NULL,
    description text,
    qty numeric(10,2),
    unit_price numeric(10,2),
    total numeric(10,2) NOT NULL,
    breakdown_json json
);


ALTER TABLE public.statement_lines OWNER TO fleet_user;

--
-- Name: statement_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.statement_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.statement_lines_id_seq OWNER TO fleet_user;

--
-- Name: statement_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.statement_lines_id_seq OWNED BY public.statement_lines.id;


--
-- Name: statements; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.statements (
    id integer NOT NULL,
    org_id integer NOT NULL,
    customer_id integer NOT NULL,
    number character varying(50) NOT NULL,
    period_from timestamp with time zone NOT NULL,
    period_to timestamp with time zone NOT NULL,
    status public.statementstatus,
    subtotal numeric(10,2),
    tax numeric(10,2),
    total numeric(10,2) NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.statements OWNER TO fleet_user;

--
-- Name: statements_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.statements_id_seq OWNER TO fleet_user;

--
-- Name: statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.statements_id_seq OWNED BY public.statements.id;


--
-- Name: trailers; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.trailers (
    id integer NOT NULL,
    org_id integer NOT NULL,
    plate_number character varying(20) NOT NULL,
    capacity_ton numeric(5,2),
    capacity_m3 numeric(5,2),
    is_active boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.trailers OWNER TO fleet_user;

--
-- Name: trailers_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.trailers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.trailers_id_seq OWNER TO fleet_user;

--
-- Name: trailers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.trailers_id_seq OWNED BY public.trailers.id;


--
-- Name: trucks; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.trucks (
    id integer NOT NULL,
    org_id integer NOT NULL,
    plate_number character varying(20) NOT NULL,
    model character varying(100),
    truck_type character varying(50),
    capacity_ton numeric(5,2),
    capacity_m3 numeric(5,2),
    insurance_expiry timestamp with time zone,
    test_expiry timestamp with time zone,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.trucks OWNER TO fleet_user;

--
-- Name: trucks_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.trucks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.trucks_id_seq OWNER TO fleet_user;

--
-- Name: trucks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.trucks_id_seq OWNED BY public.trucks.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    org_id integer NOT NULL,
    user_id integer NOT NULL,
    role public.userrole NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_roles OWNER TO fleet_user;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_roles_id_seq OWNER TO fleet_user;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    org_id integer NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    name character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_active boolean,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO fleet_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO fleet_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: weigh_tickets; Type: TABLE; Schema: public; Owner: fleet_user
--

CREATE TABLE public.weigh_tickets (
    id integer NOT NULL,
    job_id integer NOT NULL,
    ticket_number character varying(50),
    gross_weight numeric(10,2),
    tare_weight numeric(10,2),
    net_weight numeric(10,2),
    file_id integer,
    issued_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.weigh_tickets OWNER TO fleet_user;

--
-- Name: weigh_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: fleet_user
--

CREATE SEQUENCE public.weigh_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.weigh_tickets_id_seq OWNER TO fleet_user;

--
-- Name: weigh_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: fleet_user
--

ALTER SEQUENCE public.weigh_tickets_id_seq OWNED BY public.weigh_tickets.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: delivery_notes id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.delivery_notes ALTER COLUMN id SET DEFAULT nextval('public.delivery_notes_id_seq'::regclass);


--
-- Name: drivers id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.drivers ALTER COLUMN id SET DEFAULT nextval('public.drivers_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: job_files id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_files ALTER COLUMN id SET DEFAULT nextval('public.job_files_id_seq'::regclass);


--
-- Name: job_status_events id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_status_events ALTER COLUMN id SET DEFAULT nextval('public.job_status_events_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: payment_allocations id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payment_allocations ALTER COLUMN id SET DEFAULT nextval('public.payment_allocations_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: price_lists id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.price_lists ALTER COLUMN id SET DEFAULT nextval('public.price_lists_id_seq'::regclass);


--
-- Name: sites id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.sites ALTER COLUMN id SET DEFAULT nextval('public.sites_id_seq'::regclass);


--
-- Name: statement_lines id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statement_lines ALTER COLUMN id SET DEFAULT nextval('public.statement_lines_id_seq'::regclass);


--
-- Name: statements id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statements ALTER COLUMN id SET DEFAULT nextval('public.statements_id_seq'::regclass);


--
-- Name: trailers id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.trailers ALTER COLUMN id SET DEFAULT nextval('public.trailers_id_seq'::regclass);


--
-- Name: trucks id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.trucks ALTER COLUMN id SET DEFAULT nextval('public.trucks_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: weigh_tickets id; Type: DEFAULT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.weigh_tickets ALTER COLUMN id SET DEFAULT nextval('public.weigh_tickets_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.alembic_version (version_num) FROM stdin;
b2ed0bcee5a7
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.audit_logs (id, org_id, user_id, entity_type, entity_id, action, before_json, after_json, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.customers (id, org_id, name, vat_id, contact_name, phone, email, address, payment_terms, is_active, created_at, updated_at) FROM stdin;
2	1	╫º╫ס╫ץ╫ª╫¬ ╫ó╫צ╫¿╫ש╫נ╫£╫ש	515234567	╫ף╫á╫פ ╫£╫ץ╫ש	052-9876543	\N	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
3	1	╫נ╫£╫º╫ר╫¿╫פ ╫á╫ף╫£╫┤╫ƒ	515345678	╫₧╫ש╫¢╫נ╫£ ╫נ╫ס╫¿╫פ╫¥	054-1112222	\N	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
4	1	╫í╫ץ╫£╫£ ╫ס╫ץ╫á╫פ	515456789	╫¿╫ץ╫á╫ש╫¬ ╫⌐╫₧╫⌐	053-3334444	\N	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
1	1	╫ק╫ס╫¿╫¬ ╫ס╫á╫ש╫פ ╫ש╫⌐╫¿╫נ╫£ ╫ס╫ó╫┤╫₧	515123456	╫ש╫ץ╫í╫ש ╫¢╫פ╫ƒ	0532499855			Net 30	t	2026-01-25 09:46:10.521654+00	2026-01-25 13:15:04.40878+00
\.


--
-- Data for Name: delivery_notes; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.delivery_notes (id, job_id, note_number, receiver_name, receiver_signature_file_id, delivered_at, notes) FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.drivers (id, org_id, user_id, name, phone, license_type, license_expiry, is_active, created_at, updated_at) FROM stdin;
1	1	2	╫₧╫⌐╫פ ╫¢╫פ╫ƒ	050-1111111	C	\N	t	2026-01-25 09:46:10.521654+00	\N
2	1	3	╫ף╫ץ╫ף ╫£╫ץ╫ש	052-2222222	C	\N	t	2026-01-25 09:46:10.521654+00	\N
3	1	4	╫ש╫ץ╫í╫ש ╫נ╫ס╫¿╫פ╫¥	053-3333333	C	\N	t	2026-01-25 09:46:10.521654+00	\N
4	1	5	╫נ╫ס╫ש ╫⌐╫₧╫⌐	054-4444444	C	\N	t	2026-01-25 09:46:10.521654+00	\N
5	1	6	╫¿╫ץ╫á╫ש ╫ס╫¿╫º	055-5555555	C	\N	t	2026-01-25 09:46:10.521654+00	\N
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.expenses (id, org_id, category, amount, expense_date, vendor_name, truck_id, driver_id, job_id, file_id, note, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.files (id, org_id, storage_key, filename, mime_type, size, uploaded_by, uploaded_at) FROM stdin;
1	1	jobs/2/20260125_100832_c7de8688.jpg	test_upload.jpg	application/octet-stream	31	2	2026-01-25 10:08:32.497737+00
2	1	jobs/5/20260125_100907_fe23cfb1.jpg	test_upload.jpg	application/octet-stream	31	2	2026-01-25 10:09:07.793224+00
3	1	jobs/5/20260125_102149_4bf579b1.jpg	real_photo.jpg	application/octet-stream	8888	2	2026-01-25 10:21:49.332969+00
4	1	jobs/5/20260125_102322_cf82cf00.jpg	photo.jpg	application/octet-stream	9909	2	2026-01-25 10:23:22.18391+00
5	1	jobs/3/20260125_103320_317f5150.jpg	jhj.jpg	image/jpeg	202983	2	2026-01-25 10:33:20.971717+00
\.


--
-- Data for Name: job_files; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.job_files (id, job_id, file_id, file_type, created_at) FROM stdin;
1	2	1	PHOTO	2026-01-25 10:08:32.497737+00
2	5	2	PHOTO	2026-01-25 10:09:07.793224+00
3	5	3	PHOTO	2026-01-25 10:21:49.332969+00
4	5	4	PHOTO	2026-01-25 10:23:22.18391+00
5	3	5	PHOTO	2026-01-25 10:33:20.971717+00
\.


--
-- Data for Name: job_status_events; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.job_status_events (id, job_id, status, event_time, user_id, lat, lng, note) FROM stdin;
1	1	ENROUTE_PICKUP	2026-01-25 09:53:32.93468+00	1	32.1133790	34.9629283	\N
2	1	LOADED	2026-01-25 10:04:35.49186+00	1	32.1133790	34.9629335	\N
3	1	ENROUTE_DROPOFF	2026-01-25 10:08:26.75494+00	1	32.1133790	34.9629335	\N
4	1	DELIVERED	2026-01-25 10:15:05.032697+00	1	32.1133790	34.9629283	\N
5	3	ENROUTE_DROPOFF	2026-01-25 10:16:10.687231+00	1	32.1133790	34.9629283	\N
6	7	ASSIGNED	2026-01-25 11:11:44.940547+00	1	\N	\N	\N
7	3	DELIVERED	2026-01-25 11:24:07.519052+00	1	\N	\N	\N
8	2	PLANNED	2026-01-25 11:48:42.241636+00	1	\N	\N	\N
9	1	PLANNED	2026-01-25 11:49:01.033822+00	1	\N	\N	\N
10	3	PLANNED	2026-01-25 11:49:02.520923+00	1	\N	\N	\N
11	4	PLANNED	2026-01-25 11:49:06.328712+00	1	\N	\N	\N
12	7	PLANNED	2026-01-25 11:49:07.870533+00	1	\N	\N	\N
13	5	PLANNED	2026-01-25 11:49:09.818257+00	1	\N	\N	\N
14	2	ASSIGNED	2026-01-25 11:50:06.268114+00	1	\N	\N	\N
15	2	PLANNED	2026-01-25 11:51:34.987322+00	1	\N	\N	\N
16	3	ASSIGNED	2026-01-25 11:51:54.755064+00	1	\N	\N	\N
17	5	ASSIGNED	2026-01-25 11:51:55.484871+00	1	\N	\N	\N
18	4	ASSIGNED	2026-01-25 11:51:56.515059+00	1	\N	\N	\N
19	2	ASSIGNED	2026-01-25 11:51:57.653593+00	1	\N	\N	\N
20	5	PLANNED	2026-01-25 11:53:42.812188+00	1	\N	\N	\N
21	1	ASSIGNED	2026-01-25 11:55:29.86976+00	1	\N	\N	\N
22	5	ASSIGNED	2026-01-25 11:55:31.636326+00	1	\N	\N	\N
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.jobs (id, org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, priority, driver_id, truck_id, trailer_id, planned_qty, actual_qty, unit, status, pricing_total, pricing_breakdown_json, manual_override_total, manual_override_reason, notes, is_billable, created_by, created_at, updated_at) FROM stdin;
4	1	3	5	8	5	2026-01-25 00:00:00+00	1	3	\N	\N	22.00	\N	TON	ASSIGNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 11:58:01.437235+00
2	1	1	7	2	2	2026-01-25 00:00:00+00	1	1	\N	\N	28.00	\N	TON	ASSIGNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 13:40:12.935847+00
1	1	1	7	1	1	2026-01-25 00:00:00+00	1	1	\N	\N	25.00	\N	TON	ASSIGNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 13:53:20.928606+00
3	1	2	7	3	3	2026-01-25 00:00:00+00	1	2	\N	\N	30.00	\N	TON	ASSIGNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 13:53:28.503372+00
5	1	4	7	6	6	2026-01-25 00:00:00+00	1	1	\N	\N	26.00	\N	TON	ASSIGNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 13:53:31.594252+00
6	1	1	7	1	1	2026-01-26 00:00:00+00	1	1	1	\N	27.00	40.00	TON	PLANNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 14:14:28.941229+00
7	1	2	7	4	4	2026-01-26 00:00:00+00	1	2	2	\N	18.00	\N	M3	PLANNED	\N	\N	\N	\N	\N	f	\N	2026-01-25 09:46:10.521654+00	2026-01-25 11:49:07.870533+00
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.materials (id, org_id, name, name_hebrew, billing_unit, density, is_active, created_at) FROM stdin;
1	1	╫ó╫ñ╫¿	╫ó╫ñ╫¿	TON	\N	t	2026-01-25 09:46:10.521654+00
2	1	╫ק╫ª╫Ñ	╫ק╫ª╫Ñ	TON	\N	t	2026-01-25 09:46:10.521654+00
3	1	╫₧╫ª╫ó	╫₧╫ª╫ó	TON	\N	t	2026-01-25 09:46:10.521654+00
4	1	╫ק╫ץ╫£	╫ק╫ץ╫£	M3	\N	t	2026-01-25 09:46:10.521654+00
5	1	╫ñ╫í╫ץ╫£╫¬ ╫ס╫á╫ש╫ש╫ƒ	╫ñ╫í╫ץ╫£╫¬ ╫ס╫á╫ש╫ש╫ƒ	TON	\N	t	2026-01-25 09:46:10.521654+00
6	1	╫נ╫í╫ñ╫£╫ר	╫נ╫í╫ñ╫£╫ר	TON	\N	t	2026-01-25 09:46:10.521654+00
\.


--
-- Data for Name: payment_allocations; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.payment_allocations (id, payment_id, statement_id, amount) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.payments (id, org_id, customer_id, amount, paid_at, method, reference, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: price_lists; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.price_lists (id, org_id, customer_id, material_id, from_site_id, to_site_id, unit, base_price, min_charge, wait_fee_per_hour, night_surcharge_pct, valid_from, valid_to, created_at) FROM stdin;
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.sites (id, org_id, customer_id, name, address, lat, lng, opening_hours, access_notes, is_active, created_at, updated_at) FROM stdin;
1	1	1	╫ñ╫¿╫ץ╫ש╫º╫ר ╫¿╫₧╫¬ ╫נ╫ס╫ש╫ס	╫¿╫ק╫ץ╫ס ╫ש╫¿╫º╫ץ╫ƒ 123, ╫¬╫£ ╫נ╫ס╫ש╫ס	32.1133000	34.8036000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
2	1	1	╫ñ╫¿╫ץ╫ש╫º╫ר ╫פ╫¿╫ª╫£╫ש╫פ ╫ñ╫ש╫¬╫ץ╫ק	╫ף╫¿╫ת ╫פ╫⌐╫¿╫ץ╫ƒ 45, ╫פ╫¿╫ª╫£╫ש╫פ	32.1656000	34.8116000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
3	1	2	╫₧╫ע╫ף╫£╫ש ╫ó╫צ╫¿╫ש╫נ╫£╫ש ╫¿╫נ╫⌐╫ץ╫ƒ	╫⌐╫ף╫¿╫ץ╫¬ ╫ש╫¿╫ץ╫⌐╫£╫ש╫¥ 1, ╫¿╫נ╫⌐╫ץ╫ƒ ╫£╫ª╫ש╫ץ╫ƒ	31.9730000	34.7925000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
4	1	2	╫ó╫צ╫¿╫ש╫נ╫£╫ש ╫ק╫ץ╫£╫ץ╫ƒ	╫¿╫ק╫ץ╫ס ╫í╫ץ╫º╫ץ╫£╫ץ╫ס 88, ╫ק╫ץ╫£╫ץ╫ƒ	32.0128000	34.7743000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
5	1	3	╫ñ╫¿╫ץ╫ש╫º╫ר ╫á╫¬╫á╫ש╫פ ╫₧╫ó╫¿╫ס	╫¿╫ק╫ץ╫ס ╫ץ╫ש╫ª╫₧╫ƒ 200, ╫á╫¬╫á╫ש╫פ	32.3215000	34.8532000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
6	1	4	╫¢╫ס╫ש╫⌐ 531 - ╫º╫ר╫ó ╫ס╫│	╫¢╫ס╫ש╫⌐ 531, ╫ª╫ץ╫₧╫¬ ╫ס╫ש╫¬ ╫ף╫ע╫ƒ	31.8969000	34.8186000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
7	1	1	╫₧╫ק╫ª╫ס╫¬ ╫á╫⌐╫¿	╫נ╫צ╫ץ╫¿ ╫¬╫ó╫⌐╫ש╫ש╫פ ╫á╫⌐╫¿	32.7940000	35.0279000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
8	1	1	╫₧╫צ╫ס╫£╫פ ╫נ╫¿╫ש╫נ╫£	╫נ╫צ╫ץ╫¿ ╫¬╫ó╫⌐╫ש╫ש╫פ ╫נ╫¿╫ש╫נ╫£	32.1059000	35.1816000	\N	\N	t	2026-01-25 09:46:10.521654+00	2026-01-25 10:35:47.056769+00
\.


--
-- Data for Name: statement_lines; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.statement_lines (id, statement_id, job_id, description, qty, unit_price, total, breakdown_json) FROM stdin;
\.


--
-- Data for Name: statements; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.statements (id, org_id, customer_id, number, period_from, period_to, status, subtotal, tax, total, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trailers; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.trailers (id, org_id, plate_number, capacity_ton, capacity_m3, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: trucks; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.trucks (id, org_id, plate_number, model, truck_type, capacity_ton, capacity_m3, insurance_expiry, test_expiry, is_active, created_at, updated_at) FROM stdin;
1	1	12-345-67	╫ץ╫ץ╫£╫ץ╫ץ FH16	\N	30.00	20.00	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
2	1	23-456-78	╫₧╫¿╫ª╫ף╫í ╫נ╫º╫ר╫¿╫ץ╫í	\N	28.00	18.00	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
3	1	34-567-89	╫í╫º╫á╫ש╫פ R500	\N	32.00	22.00	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
4	1	45-678-90	╫₧╫נ╫ƒ TGX	\N	29.00	19.00	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
5	1	56-789-01	╫נ╫ש╫ץ╫ץ╫º╫ץ ╫í╫ר╫¿╫£╫ש╫í	\N	27.00	17.00	\N	\N	t	2026-01-25 09:46:10.521654+00	\N
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.user_roles (id, org_id, user_id, role, created_at) FROM stdin;
1	1	1	ADMIN	2026-01-25 09:41:41.159547+00
2	1	2	DRIVER	2026-01-25 09:46:10.521654+00
3	1	3	DRIVER	2026-01-25 09:46:10.521654+00
4	1	4	DRIVER	2026-01-25 09:46:10.521654+00
5	1	5	DRIVER	2026-01-25 09:46:10.521654+00
6	1	6	DRIVER	2026-01-25 09:46:10.521654+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.users (id, org_id, email, phone, name, password_hash, is_active, created_at, updated_at) FROM stdin;
1	1	admin@fleet.com	\N	Admin User	$2b$12$O8rp/MEsfx7EPFpocJ6pn.RwNsqwGNGNvMegz2k2TG2DuuI/eS9.e	t	2026-01-25 09:41:41.159547+00	\N
2	1	moshe@fleet.com	\N	╫₧╫⌐╫פ ╫¢╫פ╫ƒ	$2b$12$hP18mh5tvKBr0UPqdDfI.eRCgKYjx6nlwTnRxcbUPgDXGW8mvb0Je	t	2026-01-25 09:46:10.521654+00	\N
3	1	david@fleet.com	\N	╫ף╫ץ╫ף ╫£╫ץ╫ש	$2b$12$F.N2O8/6oUREfh.pU.5Sj.fFxMQOe7nhakP7hqa3dcBI1YzvYJ66S	t	2026-01-25 09:46:10.521654+00	\N
4	1	yossi@fleet.com	\N	╫ש╫ץ╫í╫ש ╫נ╫ס╫¿╫פ╫¥	$2b$12$yQ1n.C5bORfmK/mFXW73iuASEpuIFkT2u.f3qpVIYIW.hBW3qfOx2	t	2026-01-25 09:46:10.521654+00	\N
5	1	avi@fleet.com	\N	╫נ╫ס╫ש ╫⌐╫₧╫⌐	$2b$12$8WPBk249UvWij9.kMPdUCOkYTujBhJX8EKmtXds7oKO538.eIguVm	t	2026-01-25 09:46:10.521654+00	\N
6	1	roni@fleet.com	\N	╫¿╫ץ╫á╫ש ╫ס╫¿╫º	$2b$12$8ExppZUTKYGShHDmOUSqWeEaLgAs9j0x4SxG5mZmU0PpzbjmIQ8pi	t	2026-01-25 09:46:10.521654+00	\N
\.


--
-- Data for Name: weigh_tickets; Type: TABLE DATA; Schema: public; Owner: fleet_user
--

COPY public.weigh_tickets (id, job_id, ticket_number, gross_weight, tare_weight, net_weight, file_id, issued_at, created_at) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.customers_id_seq', 4, true);


--
-- Name: delivery_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.delivery_notes_id_seq', 1, false);


--
-- Name: drivers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.drivers_id_seq', 5, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, false);


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.files_id_seq', 5, true);


--
-- Name: job_files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.job_files_id_seq', 5, true);


--
-- Name: job_status_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.job_status_events_id_seq', 22, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.jobs_id_seq', 7, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.materials_id_seq', 6, true);


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.payment_allocations_id_seq', 1, false);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: price_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.price_lists_id_seq', 1, false);


--
-- Name: sites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.sites_id_seq', 8, true);


--
-- Name: statement_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.statement_lines_id_seq', 1, false);


--
-- Name: statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.statements_id_seq', 1, false);


--
-- Name: trailers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.trailers_id_seq', 1, false);


--
-- Name: trucks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.trucks_id_seq', 5, true);


--
-- Name: user_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.user_roles_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.users_id_seq', 6, true);


--
-- Name: weigh_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: fleet_user
--

SELECT pg_catalog.setval('public.weigh_tickets_id_seq', 1, false);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_notes delivery_notes_job_id_key; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.delivery_notes
    ADD CONSTRAINT delivery_notes_job_id_key UNIQUE (job_id);


--
-- Name: delivery_notes delivery_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.delivery_notes
    ADD CONSTRAINT delivery_notes_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_key UNIQUE (user_id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: job_files job_files_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_files
    ADD CONSTRAINT job_files_pkey PRIMARY KEY (id);


--
-- Name: job_status_events job_status_events_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_status_events
    ADD CONSTRAINT job_status_events_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: payment_allocations payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: price_lists price_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: statement_lines statement_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statement_lines
    ADD CONSTRAINT statement_lines_pkey PRIMARY KEY (id);


--
-- Name: statements statements_number_key; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_number_key UNIQUE (number);


--
-- Name: statements statements_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_pkey PRIMARY KEY (id);


--
-- Name: trailers trailers_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.trailers
    ADD CONSTRAINT trailers_pkey PRIMARY KEY (id);


--
-- Name: trailers trailers_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.trailers
    ADD CONSTRAINT trailers_plate_number_key UNIQUE (plate_number);


--
-- Name: trucks trucks_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.trucks
    ADD CONSTRAINT trucks_pkey PRIMARY KEY (id);


--
-- Name: trucks trucks_plate_number_key; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.trucks
    ADD CONSTRAINT trucks_plate_number_key UNIQUE (plate_number);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: weigh_tickets weigh_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.weigh_tickets
    ADD CONSTRAINT weigh_tickets_pkey PRIMARY KEY (id);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_delivery_notes_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_delivery_notes_id ON public.delivery_notes USING btree (id);


--
-- Name: ix_drivers_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_drivers_id ON public.drivers USING btree (id);


--
-- Name: ix_expenses_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_expenses_id ON public.expenses USING btree (id);


--
-- Name: ix_files_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_files_id ON public.files USING btree (id);


--
-- Name: ix_job_files_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_job_files_id ON public.job_files USING btree (id);


--
-- Name: ix_job_status_events_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_job_status_events_id ON public.job_status_events USING btree (id);


--
-- Name: ix_jobs_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_jobs_id ON public.jobs USING btree (id);


--
-- Name: ix_jobs_scheduled_date; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_jobs_scheduled_date ON public.jobs USING btree (scheduled_date);


--
-- Name: ix_jobs_status; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_jobs_status ON public.jobs USING btree (status);


--
-- Name: ix_materials_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_materials_id ON public.materials USING btree (id);


--
-- Name: ix_payment_allocations_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_payment_allocations_id ON public.payment_allocations USING btree (id);


--
-- Name: ix_payments_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_payments_id ON public.payments USING btree (id);


--
-- Name: ix_price_lists_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_price_lists_id ON public.price_lists USING btree (id);


--
-- Name: ix_sites_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_sites_id ON public.sites USING btree (id);


--
-- Name: ix_statement_lines_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_statement_lines_id ON public.statement_lines USING btree (id);


--
-- Name: ix_statements_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_statements_id ON public.statements USING btree (id);


--
-- Name: ix_trailers_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_trailers_id ON public.trailers USING btree (id);


--
-- Name: ix_trucks_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_trucks_id ON public.trucks USING btree (id);


--
-- Name: ix_user_roles_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_user_roles_id ON public.user_roles USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_weigh_tickets_id; Type: INDEX; Schema: public; Owner: fleet_user
--

CREATE INDEX ix_weigh_tickets_id ON public.weigh_tickets USING btree (id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: delivery_notes delivery_notes_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.delivery_notes
    ADD CONSTRAINT delivery_notes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: delivery_notes delivery_notes_receiver_signature_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.delivery_notes
    ADD CONSTRAINT delivery_notes_receiver_signature_file_id_fkey FOREIGN KEY (receiver_signature_file_id) REFERENCES public.files(id);


--
-- Name: drivers drivers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: expenses expenses_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: expenses expenses_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: expenses expenses_truck_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_truck_id_fkey FOREIGN KEY (truck_id) REFERENCES public.trucks(id);


--
-- Name: files files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: job_files job_files_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_files
    ADD CONSTRAINT job_files_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: job_files job_files_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_files
    ADD CONSTRAINT job_files_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: job_status_events job_status_events_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_status_events
    ADD CONSTRAINT job_status_events_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: job_status_events job_status_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.job_status_events
    ADD CONSTRAINT job_status_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: jobs jobs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: jobs jobs_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: jobs jobs_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: jobs jobs_from_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_from_site_id_fkey FOREIGN KEY (from_site_id) REFERENCES public.sites(id);


--
-- Name: jobs jobs_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: jobs jobs_to_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_to_site_id_fkey FOREIGN KEY (to_site_id) REFERENCES public.sites(id);


--
-- Name: jobs jobs_trailer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_trailer_id_fkey FOREIGN KEY (trailer_id) REFERENCES public.trailers(id);


--
-- Name: jobs jobs_truck_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_truck_id_fkey FOREIGN KEY (truck_id) REFERENCES public.trucks(id);


--
-- Name: payment_allocations payment_allocations_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id);


--
-- Name: payment_allocations payment_allocations_statement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_statement_id_fkey FOREIGN KEY (statement_id) REFERENCES public.statements(id);


--
-- Name: payments payments_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: price_lists price_lists_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: price_lists price_lists_from_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_from_site_id_fkey FOREIGN KEY (from_site_id) REFERENCES public.sites(id);


--
-- Name: price_lists price_lists_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id);


--
-- Name: price_lists price_lists_to_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_to_site_id_fkey FOREIGN KEY (to_site_id) REFERENCES public.sites(id);


--
-- Name: sites sites_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.sites
    ADD CONSTRAINT sites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: statement_lines statement_lines_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statement_lines
    ADD CONSTRAINT statement_lines_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- Name: statement_lines statement_lines_statement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statement_lines
    ADD CONSTRAINT statement_lines_statement_id_fkey FOREIGN KEY (statement_id) REFERENCES public.statements(id);


--
-- Name: statements statements_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: statements statements_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.statements
    ADD CONSTRAINT statements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: weigh_tickets weigh_tickets_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.weigh_tickets
    ADD CONSTRAINT weigh_tickets_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.files(id);


--
-- Name: weigh_tickets weigh_tickets_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: fleet_user
--

ALTER TABLE ONLY public.weigh_tickets
    ADD CONSTRAINT weigh_tickets_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id);


--
-- PostgreSQL database dump complete
--

\unrestrict noo4Km658lUXMNajYndzgE3TGprZQpffDLExSDeSFY0BADQEadiwTfSqvxQTvBx

