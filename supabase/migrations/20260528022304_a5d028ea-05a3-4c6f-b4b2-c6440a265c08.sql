-- Allow the receiver of an anonymous message to file a report.
-- Enforces: reporter_id must equal auth.uid(), and the reporter must be the
-- receiver of the message being reported; sender_id must match the message's sender.
CREATE POLICY "Receivers can report anonymous messages they received"
ON public.anonymous_message_reports
FOR INSERT
TO authenticated
WITH CHECK (
  reporter_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.anonymous_messages am
    WHERE am.id = anonymous_message_reports.message_id
      AND am.receiver_id = auth.uid()
      AND am.sender_id = anonymous_message_reports.sender_id
  )
);