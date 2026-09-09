from flask import Blueprint, jsonify, render_template, request

from app.database import lead_ekle, tum_leadler
from app.services.ai_service import AIServiceError, ai_service

api_bp = Blueprint("api", __name__)
pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/", methods=["GET"])
def home():
    return render_template("index.html")


def _health_response():
    return jsonify({"basari": True, "status": "ok", "service": "EMOVIA", "message": "API is running."})


@pages_bp.route("/health", methods=["GET"])
def health_check():
    return _health_response()


@api_bp.route("/health", methods=["GET"])
def api_health_check():
    return _health_response()


@api_bp.route("/sohbet", methods=["POST", "OPTIONS"])
def api_sohbet():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    user_message = str(data.get("mesaj", "") or "").strip()

    if not user_message:
        return jsonify({"basari": False, "status": "error", "cevap": "Mesaj alanı zorunludur."}), 400

    try:
        answer = ai_service.yanit_uret(user_message, data.get("gecmis") or [])
        return jsonify({"basari": True, "status": "success", "cevap": answer})
    except AIServiceError as exc:
        return jsonify({"basari": False, "status": "error", "cevap": str(exc)}), 503


@api_bp.route("/leads", methods=["POST", "OPTIONS"])
def api_submit_lead():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json(silent=True) or {}
    name = str(data.get("isim") or "").strip()
    phone = str(data.get("telefon") or "").strip()
    message = str(data.get("mesaj") or "").strip()

    if not name or not phone:
        return jsonify({"basari": False, "status": "error", "message": "İsim ve telefon alanları zorunludur."}), 400

    try:
        lead_id = lead_ekle(name, phone, message)
        return jsonify({
            "basari": True,
            "status": "success",
            "message": "İletişim bilgileriniz kaydedildi.",
            "id": lead_id,
        }), 201
    except RuntimeError:
        return jsonify({"basari": False, "status": "error", "message": "Kayıt sırasında bir sorun oluştu."}), 500


@api_bp.route("/leads", methods=["GET"])
def api_get_leads():
    try:
        leads = tum_leadler()
        return jsonify({
            "basari": True,
            "leadler": [
                {
                    "_id": str(lead["id"]),
                    "isim": lead["isim"],
                    "telefon": lead["telefon"],
                    "mesaj": lead["mesaj"],
                    "tarih": lead["tarih"],
                }
                for lead in leads
            ],
        })
    except RuntimeError:
        return jsonify({"basari": False, "status": "error", "message": "Lead kayıtları alınamadı."}), 500


@pages_bp.route("/dashboard", methods=["GET"])
def dashboard():
    try:
        leads = tum_leadler()
    except RuntimeError:
        leads = []
    return render_template("dashboard.html", leads=leads)
