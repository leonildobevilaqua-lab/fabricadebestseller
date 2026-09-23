import os
from PIL import Image

ASSETS_DIR = r"c:\Users\Pichau\OneDrive\FERRAMENTAS - PROFISSIONAIS\bestseller-factory-ai\frontend\public\assets"

files_to_convert = [
    "1 - A Chama Inextinguível - Ap. Custodio Ignacio.png",
    "2 – O Campo Magnético das Vendas - Leonildo Bevilaqua.png",
    "3 – A Ilusão da Cor - Edinaldo Pereira da Silva.png",
    "4 - A Nova Educação - Moisés Allaion Ferreira.png",
    "5 – O Mapa Secreto da Puberdade – Tânia Garcia.jpg",
    "6 – Memorize de Forma Inteligente, Não Árdua! – Prof. Carlos André.png",
    "7 – 3 Minutos de Silêncio – Aline Tanaka.png",
    "8 – Autodefesa é para Todos – Flávio Almeida.png",
    "9 – A Rosa e o Cravo – Solange Cristina Leandrin Betiate.png",
    "10 – Crianças do Amanhã – Carlos Bueno.png",
    "Leonildo Bevilaqua - Oficial Landing page.png",
    "clientes satisfeitos - 1.jpeg",
    "clientes satisfeitos - 2.jpeg",
    "clientes satisfeitos - 3.jpeg",
    "clientes satisfeitos - 4.jpeg",
    "clientes satisfeitos - 5.jpeg",
    "clientes satisfeitos - 6.jpeg",
]

total_before = 0
total_after = 0

print("Starting Image Optimization...")

for filename in files_to_convert:
    filepath = os.path.join(ASSETS_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Skipping (not found): {filename}")
        continue
    
    size_before = os.path.getsize(filepath)
    total_before += size_before

    base_name, _ = os.path.splitext(filename)
    webp_filename = f"{base_name}.webp"
    webp_filepath = os.path.join(ASSETS_DIR, webp_filename)

    with Image.open(filepath) as img:
        # Convert RGBA/P to RGB if saving without alpha transparency issues
        if img.mode in ("RGBA", "P"):
            # Check if image actually uses transparency
            if img.mode == "RGBA":
                alpha = img.split()[-1]
                if alpha.getextrema() == (255, 255):
                    img = img.convert("RGB")
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # Resize if extremely large (e.g. over 1600px width)
        max_dim = 1200 if "Leonildo" in filename else 800
        if max(img.width, img.height) > max_dim:
            ratio = max_dim / float(max(img.width, img.height))
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)

        img.save(webp_filepath, "WEBP", quality=85, optimize=True)

    size_after = os.path.getsize(webp_filepath)
    total_after += size_after

    kb_before = size_before / 1024
    kb_after = size_after / 1024
    reduction = ((size_before - size_after) / size_before) * 100
    print(f"[OK] {filename}: {kb_before:.1f} KB -> {webp_filename}: {kb_after:.1f} KB (-{reduction:.1f}%)")

print("\n--------------------------------------------------")
print(f"Total size before: {total_before / (1024*1024):.2f} MB")
print(f"Total size after:  {total_after / (1024*1024):.2f} MB")
print(f"Total Reduction:   {((total_before - total_after)/total_before)*100:.1f}%")
