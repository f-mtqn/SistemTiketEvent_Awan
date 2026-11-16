from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
import os

app = FastAPI(title="Sistem Tiket Event")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data seed ───────────────────────────────────────────────────────────────

events: dict[int, dict] = {
    1: {"id": 1, "nama": "Jazz Nite Bandung", "tanggal": "2026-12-10", "lokasi": "Gedung Sate, Bandung", "harga": 150000, "stok": 200},
    2: {"id": 2, "nama": "Tech Summit Jakarta", "tanggal": "2026-12-20", "lokasi": "JCC Senayan, Jakarta", "harga": 250000, "stok": 50},
    3: {"id": 3, "nama": "Pesta Rakyat Jogja", "tanggal": "2026-11-30", "lokasi": "Alun-alun Utara, Yogyakarta", "harga": 0, "stok": 500},
}

buyers: dict[int, dict] = {
    1: {"id": 1, "nama": "Andi Saputra", "email": "andi@example.com"},
    2: {"id": 2, "nama": "Budi Laksono", "email": "budi@example.com"},
    3: {"id": 3, "nama": "Citra Dewi", "email": "citra@example.com"},
}

orders: dict[int, dict] = {
    1: {"id": 1, "pembeli_id": 1, "event_id": 1, "jumlah": 2, "status": "lunas", "total_harga": 300000},
    2: {"id": 2, "pembeli_id": 2, "event_id": 2, "jumlah": 1, "status": "pending", "total_harga": 250000},
    3: {"id": 3, "pembeli_id": 3, "event_id": 1, "jumlah": 3, "status": "pending", "total_harga": 450000},
}

# Adjust stok to match seed orders (stok already reflects sold tickets)
# Jazz Nite: seed stok 200 sudah dikurangi 5 (order 1: 2 + order 3: 3)
events[1]["stok"] = 195
# Tech Summit: seed stok 50 sudah dikurangi 1 (order 2: 1)
events[2]["stok"] = 49

_event_counter = 4
_buyer_counter = 4
_order_counter = 4


def next_event_id():
    global _event_counter
    i = _event_counter
    _event_counter += 1
    return i


def next_buyer_id():
    global _buyer_counter
    i = _buyer_counter
    _buyer_counter += 1
    return i


def next_order_id():
    global _order_counter
    i = _order_counter
    _order_counter += 1
    return i


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    nama: str
    tanggal: str  # YYYY-MM-DD
    lokasi: str
    harga: int
    stok: int

    @field_validator("harga", "stok")
    @classmethod
    def non_negative(cls, v: int, info):
        if v < 0:
            raise ValueError(f"{info.field_name} tidak boleh negatif")
        return v


class BuyerCreate(BaseModel):
    nama: str
    email: EmailStr


class OrderCreate(BaseModel):
    pembeli_id: int
    event_id: int
    jumlah: int

    @field_validator("jumlah")
    @classmethod
    def at_least_one(cls, v):
        if v < 1:
            raise ValueError("jumlah minimal 1")
        return v


class OrderUpdate(BaseModel):
    jumlah: Optional[int] = None
    status: Optional[str] = None

    @field_validator("jumlah")
    @classmethod
    def at_least_one(cls, v):
        if v is not None and v < 1:
            raise ValueError("jumlah minimal 1")
        return v

    @field_validator("status")
    @classmethod
    def valid_status(cls, v):
        if v is not None and v not in ("pending", "lunas", "batal"):
            raise ValueError("status harus pending, lunas, atau batal")
        return v


# ─── Helpers ─────────────────────────────────────────────────────────────────

def order_count_for_event(event_id: int) -> int:
    return sum(1 for o in orders.values() if o["event_id"] == event_id)


def order_count_for_buyer(buyer_id: int) -> int:
    return sum(1 for o in orders.values() if o["pembeli_id"] == buyer_id)


def enrich_order(o: dict) -> dict:
    buyer = buyers.get(o["pembeli_id"], {})
    event = events.get(o["event_id"], {})
    return {
        **o,
        "pembeli_nama": buyer.get("nama", ""),
        "event_nama": event.get("nama", ""),
    }


# ─── Event endpoints ─────────────────────────────────────────────────────────

@app.get("/events")
def list_events():
    result = []
    for e in events.values():
        result.append({**e, "jumlah_pesanan": order_count_for_event(e["id"])})
    return result


@app.get("/events/{event_id}")
def get_event(event_id: int):
    e = events.get(event_id)
    if not e:
        raise HTTPException(404, "Event tidak ditemukan")
    related = [enrich_order(o) for o in orders.values() if o["event_id"] == event_id]
    return {**e, "pesanan": related}


@app.post("/events", status_code=201)
def create_event(body: EventCreate):
    eid = next_event_id()
    events[eid] = {"id": eid, **body.model_dump()}
    return events[eid]


@app.put("/events/{event_id}")
def update_event(event_id: int, body: EventCreate):
    e = events.get(event_id)
    if not e:
        raise HTTPException(404, "Event tidak ditemukan")
    events[event_id] = {"id": event_id, **body.model_dump()}
    return events[event_id]


@app.delete("/events/{event_id}")
def delete_event(event_id: int):
    e = events.get(event_id)
    if not e:
        raise HTTPException(404, "Event tidak ditemukan")
    if order_count_for_event(event_id) > 0:
        raise HTTPException(400, "Event ini masih memiliki pesanan dan tidak dapat dihapus")
    del events[event_id]
    return {"detail": "Event berhasil dihapus"}


# ─── Buyer endpoints ─────────────────────────────────────────────────────────

@app.get("/buyers")
def list_buyers():
    result = []
    for b in buyers.values():
        result.append({**b, "jumlah_pesanan": order_count_for_buyer(b["id"])})
    return result


@app.get("/buyers/{buyer_id}")
def get_buyer(buyer_id: int):
    b = buyers.get(buyer_id)
    if not b:
        raise HTTPException(404, "Pembeli tidak ditemukan")
    related = [enrich_order(o) for o in orders.values() if o["pembeli_id"] == buyer_id]
    return {**b, "pesanan": related}


@app.post("/buyers", status_code=201)
def create_buyer(body: BuyerCreate):
    bid = next_buyer_id()
    buyers[bid] = {"id": bid, **body.model_dump()}
    return buyers[bid]


@app.put("/buyers/{buyer_id}")
def update_buyer(buyer_id: int, body: BuyerCreate):
    b = buyers.get(buyer_id)
    if not b:
        raise HTTPException(404, "Pembeli tidak ditemukan")
    buyers[buyer_id] = {"id": buyer_id, **body.model_dump()}
    return buyers[buyer_id]


@app.delete("/buyers/{buyer_id}")
def delete_buyer(buyer_id: int):
    b = buyers.get(buyer_id)
    if not b:
        raise HTTPException(404, "Pembeli tidak ditemukan")
    if order_count_for_buyer(buyer_id) > 0:
        raise HTTPException(400, "Pembeli ini masih memiliki pesanan dan tidak dapat dihapus")
    del buyers[buyer_id]
    return {"detail": "Pembeli berhasil dihapus"}


# ─── Order endpoints ─────────────────────────────────────────────────────────

@app.get("/orders")
def list_orders(buyer_id: Optional[int] = None, event_id: Optional[int] = None):
    result = []
    for o in orders.values():
        if buyer_id is not None and o["pembeli_id"] != buyer_id:
            continue
        if event_id is not None and o["event_id"] != event_id:
            continue
        result.append(enrich_order(o))
    return result


@app.get("/orders/{order_id}")
def get_order(order_id: int):
    o = orders.get(order_id)
    if not o:
        raise HTTPException(404, "Pesanan tidak ditemukan")
    return enrich_order(o)


@app.post("/orders", status_code=201)
def create_order(body: OrderCreate):
    if body.pembeli_id not in buyers:
        raise HTTPException(400, "Pembeli tidak ditemukan")
    e = events.get(body.event_id)
    if not e:
        raise HTTPException(400, "Event tidak ditemukan")
    if body.jumlah > e["stok"]:
        raise HTTPException(400, f"Stok tidak cukup. Stok tersedia: {e['stok']}")
    oid = next_order_id()
    total = body.jumlah * e["harga"]
    orders[oid] = {
        "id": oid,
        "pembeli_id": body.pembeli_id,
        "event_id": body.event_id,
        "jumlah": body.jumlah,
        "status": "pending",
        "total_harga": total,
    }
    e["stok"] -= body.jumlah
    return enrich_order(orders[oid])


@app.put("/orders/{order_id}")
def update_order(order_id: int, body: OrderUpdate):
    o = orders.get(order_id)
    if not o:
        raise HTTPException(404, "Pesanan tidak ditemukan")
    e = events[o["event_id"]]

    new_jumlah = body.jumlah if body.jumlah is not None else o["jumlah"]
    new_status = body.status if body.status is not None else o["status"]
    old_status = o["status"]
    old_jumlah = o["jumlah"]

    # Jumlah tidak bisa diubah jika pesanan batal
    if old_status == "batal" and body.jumlah is not None and body.jumlah != old_jumlah:
        raise HTTPException(400, "Jumlah pesanan berstatus batal tidak dapat diubah")

    # Hitung perubahan stok
    if old_status == "batal" and new_status in ("pending", "lunas"):
        # Reaktivasi: kurangi stok
        if new_jumlah > e["stok"]:
            raise HTTPException(400, f"Stok tidak cukup untuk reaktivasi. Stok tersedia: {e['stok']}")
        e["stok"] -= new_jumlah
    elif old_status in ("pending", "lunas") and new_status == "batal":
        # Batalkan: kembalikan stok
        e["stok"] += old_jumlah
    elif old_status in ("pending", "lunas") and new_status in ("pending", "lunas"):
        # Ubah jumlah (selisih)
        diff = new_jumlah - old_jumlah
        if diff > 0 and diff > e["stok"]:
            raise HTTPException(400, f"Stok tidak cukup. Stok tersedia: {e['stok']}")
        e["stok"] -= diff

    o["jumlah"] = new_jumlah
    o["status"] = new_status
    o["total_harga"] = new_jumlah * e["harga"]
    return enrich_order(o)


@app.delete("/orders/{order_id}")
def delete_order(order_id: int):
    o = orders.get(order_id)
    if not o:
        raise HTTPException(404, "Pesanan tidak ditemukan")
    # Kembalikan stok hanya jika bukan batal
    if o["status"] != "batal":
        e = events.get(o["event_id"])
        if e:
            e["stok"] += o["jumlah"]
    del orders[order_id]
    return {"detail": "Pesanan berhasil dihapus"}


# ─── Serve static frontend ────────────────────────────────────────────────────

frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")

app.mount("/static", StaticFiles(directory=os.path.join(frontend_dir, "static")), name="static")


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    index = os.path.join(frontend_dir, "index.html")
    return FileResponse(index)
