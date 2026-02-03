import json
import sys

def motor_diagnostico(modelo, consumo):
    try:
        ma = int(consumo)
    except:
        ma = 0

    conocimiento = {
        "iphone_11": [
            {"min": 0, "max": 100, "diag": "Falla IC Hydra (Carga).", "x": 40, "y": 75},
            {"min": 101, "max": 2000, "diag": "Corto en VCC_MAIN.", "x": 60, "y": 35}
        ],
        "iphone_12": [
            {"min": 0, "max": 2000, "diag": "Falla Interposer (Placas).", "x": 50, "y": 50}
        ]
    }

    res = {"diag": "Medición básica requerida.", "x": 0, "y": 0}
    if modelo.lower() in conocimiento:
        for p in conocimiento[modelo.lower()]:
            if p["min"] <= ma <= p["max"]:
                res = {"diag": p["diag"], "x": p["x"], "y": p["y"]}
                break

    return json.dumps({
        "modelo": modelo.upper(),
        "diagnostico": res["diag"],
        "tp_x": res["x"],
        "tp_y": res["y"]
    })

if __name__ == "__main__":
    if len(sys.argv) > 2:
        print(motor_diagnostico(sys.argv[1], sys.argv[2]))