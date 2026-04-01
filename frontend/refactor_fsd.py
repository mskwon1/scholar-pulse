import os
import json

# 1. Create directories
dirs = [
    "src/shared/ui",
    "src/shared/lib",
    "src/shared/api",
    "src/entities/user/model",
    "src/features/topic-manager/model",
    "src/features/auth/api",
    "src/features/auth/ui",
    "src/widgets/auth/ui",
    "src/widgets/home/ui",
    "src/views/home/ui",
    "src/views/auth/ui",
    "src/app/_providers",
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

# 2. Move files using subprocess instead of straight os.system without checking
import subprocess
subprocess.run("mv src/components/ui/* src/shared/ui/ 2>/dev/null", shell=True)
subprocess.run("mv src/lib/utils.ts src/shared/lib/ 2>/dev/null", shell=True)
subprocess.run("mv src/lib/supabase.ts src/shared/api/ 2>/dev/null", shell=True)
subprocess.run("mv src/lib/query-keys.ts src/shared/api/ 2>/dev/null", shell=True)

# 3. Store logic splitting...
with open("src/entities/user/model/store.ts", "w") as f:
    f.write("import { atom } from 'jotai';\nimport { User } from '@supabase/auth-js';\nexport const userAtom = atom<User | null>(null);\n")

with open("src/features/topic-manager/model/store.ts", "w") as f:
    f.write("import { atom } from 'jotai';\nexport const aiPromptsAtom = atom<Record<number, string>>({});\nexport const recommendingAtom = atom<Record<number, boolean>>({});\n")

if os.path.exists("src/lib/store.ts"):
    os.remove("src/lib/store.ts")

# 4. Search and Replace imports
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            path = os.path.join(root, f)
            with open(path, 'r') as fp:
                content = fp.read()
            
            content = content.replace("@/components/ui", "@/shared/ui")
            content = content.replace("@/lib/utils", "@/shared/lib/utils")
            content = content.replace("@/lib/supabase", "@/shared/api/supabase")
            content = content.replace("@/lib/query-keys", "@/shared/api/query-keys")
            content = content.replace("import { userAtom } from '@/lib/store';", "import { userAtom } from '@/entities/user/model/store';")
            content = content.replace("import { aiPromptsAtom, recommendingAtom } from '@/lib/store';", "import { aiPromptsAtom, recommendingAtom } from '@/features/topic-manager/model/store';")
            
            with open(path, 'w') as fp:
                fp.write(content)

# 5. Fix components.json
if os.path.exists("components.json"):
    with open("components.json", "r") as f:
        c = json.load(f)
    if "aliases" in c:
        c["aliases"]["components"] = "@/shared/ui"
        c["aliases"]["ui"] = "@/shared/ui"
        c["aliases"]["utils"] = "@/shared/lib/utils"
    with open("components.json", "w") as f:
        json.dump(c, f, indent=2)

print("Directory creation and global search-and-replace complete.")
