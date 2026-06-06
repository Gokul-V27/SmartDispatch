import sys

filename = '/Users/gokul/Desktop/document2/smartdispatch/smartdispatch_web_source/src/App.tsx'

with open(filename, 'r') as f:
    lines = f.readlines()

new_lines = lines[:3074]
new_lines.append("          {/* ========================================================= */}\n")
new_lines.append("          {/* TAB 8: WAREHOUSE PACKER EMULATOR & HIGH SPEED TESTING */}\n")
new_lines.append("          {/* ========================================================= */}\n")
new_lines.append("          {activeTab === 'emulator' && (\n")
new_lines.append("            <EmulatorPage \n")
new_lines.append("              orders={orders}\n")
new_lines.append("              setOrders={setOrders}\n")
new_lines.append("              workers={workers}\n")
new_lines.append("              addToast={addToast}\n")
new_lines.append("            />\n")
new_lines.append("          )}\n")
new_lines.extend(lines[3447:])

with open(filename, 'w') as f:
    f.writelines(new_lines)

print("Done")
