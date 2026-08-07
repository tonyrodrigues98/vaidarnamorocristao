GRANT SELECT ON public.conversation_messages_v2 TO authenticated;
GRANT SELECT ON public.conversation_attachments_v2 TO authenticated;
GRANT ALL ON public.conversation_messages_v2 TO service_role;
GRANT ALL ON public.conversation_attachments_v2 TO service_role;