begin;
alter type public.incident_type add value if not exists 'RON_EXECUTED_BYTES_CHANGED';
alter type public.incident_type add value if not exists 'RON_SECURITY_COMPROMISE';
commit;
