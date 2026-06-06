import sys

filename = '/Users/gokul/Desktop/document2/smartdispatch/smartdispatch_web_source/src/App.tsx'

with open(filename, 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    if i == 1433: # dashboard
        new_lines.append("          {activeTab === 'dashboard' && (\n")
        new_lines.append("            <DashboardPage\n")
        new_lines.append("              orders={orders}\n")
        new_lines.append("              alerts={alerts}\n")
        new_lines.append("              setActiveTab={setActiveTab}\n")
        new_lines.append("              setOrderStatusFilter={setOrderStatusFilter}\n")
        new_lines.append("              addToast={addToast}\n")
        new_lines.append("              handleResolveAlert={handleResolveAlert}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n")
        i = 1772
    elif i == 1776: # products
        new_lines.append("          {activeTab === 'products' && (\n")
        new_lines.append("            <ProductsPage\n")
        new_lines.append("              products={products}\n")
        new_lines.append("              productSearch={productSearch}\n")
        new_lines.append("              setProductSearch={setProductSearch}\n")
        new_lines.append("              productCategory={productCategory}\n")
        new_lines.append("              setProductCategory={setProductCategory}\n")
        new_lines.append("              showAddProductModal={showAddProductModal}\n")
        new_lines.append("              setShowAddProductModal={setShowAddProductModal}\n")
        new_lines.append("              newProduct={newProduct}\n")
        new_lines.append("              setNewProduct={setNewProduct}\n")
        new_lines.append("              handleCreateProduct={handleCreateProduct}\n")
        new_lines.append("              generateBarcodePdfSheet={generateBarcodePdfSheet}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n")
        i = 2104
    elif i == 2108: # orders
        new_lines.append("          {activeTab === 'orders' && (\n")
        new_lines.append("            <OrdersPage\n")
        new_lines.append("              orders={orders}\n")
        new_lines.append("              workers={workers}\n")
        new_lines.append("              filteredOrders={filteredOrders}\n")
        new_lines.append("              orderSearch={orderSearch}\n")
        new_lines.append("              setOrderSearch={setOrderSearch}\n")
        new_lines.append("              orderStatusFilter={orderStatusFilter}\n")
        new_lines.append("              setOrderStatusFilter={setOrderStatusFilter}\n")
        new_lines.append("              exportToCsv={exportToCsv}\n")
        new_lines.append("              bulkSelectedOrderIds={bulkSelectedOrderIds}\n")
        new_lines.append("              setBulkSelectedOrderIds={setBulkSelectedOrderIds}\n")
        new_lines.append("              setShowBulkPrintModal={setShowBulkPrintModal}\n")
        new_lines.append("              setShowBulkAssignModal={setShowBulkAssignModal}\n")
        new_lines.append("              selectedOrderId={selectedOrderId}\n")
        new_lines.append("              setSelectedOrderId={setSelectedOrderId}\n")
        new_lines.append("              handleAssignPacker={handleAssignPacker}\n")
        new_lines.append("              setNfcPopupOrder={setNfcPopupOrder}\n")
        new_lines.append("              setShowNfcPopup={setShowNfcPopup}\n")
        new_lines.append("              playBuzzerSound={playBuzzerSound}\n")
        new_lines.append("              autoPrintEnabled={autoPrintEnabled}\n")
        new_lines.append("              setAutoPrintCountdown={setAutoPrintCountdown}\n")
        new_lines.append("              handleAdvanceOrderStatus={handleAdvanceOrderStatus}\n")
        new_lines.append("              activeNfcHandshaking={activeNfcHandshaking}\n")
        new_lines.append("              handleNfcSealTapSimulation={handleNfcSealTapSimulation}\n")
        new_lines.append("              setSelectedPrintOrderId={setSelectedPrintOrderId}\n")
        new_lines.append("              setActiveTab={setActiveTab}\n")
        new_lines.append("              showBulkAssignModal={showBulkAssignModal}\n")
        new_lines.append("              bulkAssignTargetPackerId={bulkAssignTargetPackerId}\n")
        new_lines.append("              setBulkAssignTargetPackerId={setBulkAssignTargetPackerId}\n")
        new_lines.append("              handleBulkAssignPacker={handleBulkAssignPacker}\n")
        new_lines.append("              showBulkPrintModal={showBulkPrintModal}\n")
        new_lines.append("              generateBulkConsolidatedPdfReport={generateBulkConsolidatedPdfReport}\n")
        new_lines.append("              addToast={addToast}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n")
        i = 2502
    elif i == 2506: # print
        new_lines.append("          {activeTab === 'print' && (\n")
        new_lines.append("            <PrintCenterPage\n")
        new_lines.append("              orders={orders}\n")
        new_lines.append("              handlePrintAllReadyLabels={handlePrintAllReadyLabels}\n")
        new_lines.append("              printQueueFilter={printQueueFilter}\n")
        new_lines.append("              setPrintQueueFilter={setPrintQueueFilter}\n")
        new_lines.append("              selectedPrintOrderId={selectedPrintOrderId}\n")
        new_lines.append("              setSelectedPrintOrderId={setSelectedPrintOrderId}\n")
        new_lines.append("              isEditLabelMode={isEditLabelMode}\n")
        new_lines.append("              setIsEditLabelMode={setIsEditLabelMode}\n")
        new_lines.append("              handleSaveLabelEdits={handleSaveLabelEdits}\n")
        new_lines.append("              editLabelData={editLabelData}\n")
        new_lines.append("              setEditLabelData={setEditLabelData}\n")
        new_lines.append("              handleMarkPrinted={handleMarkPrinted}\n")
        new_lines.append("              activeNfcHandshaking={activeNfcHandshaking}\n")
        new_lines.append("              handleNfcSealTapSimulation={handleNfcSealTapSimulation}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n")
        i = 2896
    elif i == 3077: # emulator
        new_lines.append("          {activeTab === 'emulator' && (\n")
        new_lines.append("            <EmulatorPage\n")
        new_lines.append("              orders={orders}\n")
        new_lines.append("              setOrders={setOrders}\n")
        new_lines.append("              workers={workers}\n")
        new_lines.append("              addToast={addToast}\n")
        new_lines.append("            />\n")
        new_lines.append("          )}\n")
        i = 3785
    else:
        new_lines.append(lines[i])
        i += 1

with open(filename, 'w') as f:
    f.writelines(new_lines)

print("Done")
