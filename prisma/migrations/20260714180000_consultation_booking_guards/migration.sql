-- Doppelbuchung eines Slots DB-seitig unmoeglich machen (Relation wird damit 1:1).
CREATE UNIQUE INDEX "ConsultationBooking_slotId_key" ON "ConsultationBooking"("slotId");

-- Doppelte Slots aus paralleler Lazy-Generierung ausschliessen.
-- Ersetzt den bisherigen Non-Unique-Index auf start.
DROP INDEX "ConsultationSlot_start_idx";
CREATE UNIQUE INDEX "ConsultationSlot_start_key" ON "ConsultationSlot"("start");
