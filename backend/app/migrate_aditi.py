"""
One-time script to reassign all seeded clinical data to aditi@gmail.com.
Run: python -m app.migrate_aditi
"""
import asyncio
from sqlalchemy import select, update

from app.database import async_session, engine, Base
from app.models.user import User
from app.models.patient import Patient
from app.models.medication import Medication
from app.models.alert import Alert
from app.models.handoff import Handoff
from app.models.voice_note import VoiceNote


async def migrate():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Get aditi
        result = await db.execute(select(User).where(User.email == "aditi@gmail.com"))
        aditi = result.scalar_one_or_none()
        if not aditi:
            print("❌ aditi@gmail.com not found. Please register first.")
            return

        # Get priya (the original seeded nurse)
        result = await db.execute(select(User).where(User.email == "priya.rn@hospital.com"))
        priya = result.scalar_one_or_none()

        aditi_id = aditi.id
        print(f"✅ Found aditi@gmail.com (id={aditi_id})")

        # Reassign patients
        await db.execute(
            update(Patient)
            .where(Patient.assigned_nurse_id == (priya.id if priya else None))
            .values(assigned_nurse_id=aditi_id)
        )

        # Reassign alerts
        await db.execute(
            update(Alert)
            .where(Alert.assigned_nurse_id == (priya.id if priya else None))
            .values(assigned_nurse_id=aditi_id)
        )

        # Reassign handoffs (outgoing nurse)
        await db.execute(
            update(Handoff)
            .where(Handoff.outgoing_nurse_id == (priya.id if priya else None))
            .values(outgoing_nurse_id=aditi_id)
        )

        # Reassign voice notes
        await db.execute(
            update(VoiceNote)
            .where(VoiceNote.nurse_id == (priya.id if priya else None))
            .values(nurse_id=aditi_id)
        )

        # Reassign administered medications
        await db.execute(
            update(Medication)
            .where(Medication.administered_by_id == (priya.id if priya else None))
            .values(administered_by_id=aditi_id)
        )

        await db.commit()
        print("✅ All seeded clinical data reassigned to aditi@gmail.com")
        print("   Login: aditi@gmail.com / Password123!")


if __name__ == "__main__":
    asyncio.run(migrate())
