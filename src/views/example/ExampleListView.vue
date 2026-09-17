<script setup>
import { ref, reactive, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import {
  EllipsisOutlined,
  PlusOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import { exampleList, nextExampleId } from "../../mock/example";
import { EXAMPLE_STATUS, findEnumLabel } from "../../mock/enums";

// ──────────────────────────────────────────────────────────────
// 筛选状态：搜索栏字段
// ──────────────────────────────────────────────────────────────
const filters = reactive({
  name: "",
  status: undefined,
});

// P2-04 修订：编辑态与已提交态分离，避免输入过程中列表提前变化
const appliedFilters = reactive({
  name: "",
  status: undefined,
});

// 查询时才提交筛选条件，让按钮承担明确的查询触发职责
function handleSearch() {
  appliedFilters.name = filters.name.trim();
  appliedFilters.status = filters.status;
}

// 重置时同步清空编辑态和已提交态，列表立即回到全量
function handleReset() {
  filters.name = "";
  filters.status = undefined;
  appliedFilters.name = "";
  appliedFilters.status = undefined;
}

// ──────────────────────────────────────────────────────────────
// 列表数据：按 vue-ui-implementation.mdc ## 列表默认排序
// createTime 字段降序，最新创建的记录排最前
// ──────────────────────────────────────────────────────────────
const filteredList = computed(() => {
  let list = exampleList.filter((item) => {
    // 名称模糊匹配：空字符串视为不筛选，避免 toLowerCase 报错
    const matchName = appliedFilters.name
      ? item.name.toLowerCase().includes(appliedFilters.name.toLowerCase())
      : true;
    // 状态精确匹配：undefined 视为不筛选
    const matchStatus = appliedFilters.status
      ? item.status === appliedFilters.status
      : true;
    return matchName && matchStatus;
  });
  // 字符串日期 ISO 格式可直接 localeCompare 降序
  list = list.sort((a, b) => b.createTime.localeCompare(a.createTime));
  return list;
});

// ──────────────────────────────────────────────────────────────
// 2026-07-22 修订：列表多选与批量操作示例，已归档记录禁止再次选中
// ──────────────────────────────────────────────────────────────
const selectedRowKeys = ref([]);
const hasSelectedRows = computed(() => selectedRowKeys.value.length > 0);

// rowSelection 受控保存选中项，确保批量操作后可统一清空勾选状态
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange(keys) {
    selectedRowKeys.value = keys;
  },
  getCheckboxProps(record) {
    return {
      disabled: record.status === "archived",
      name: record.name,
    };
  },
}));

// 只返回仍可变更的选中记录，逻辑层再次排除归档终态
function getSelectedRecords() {
  return exampleList.filter((item) => {
    const selected = selectedRowKeys.value.includes(item.id);
    return selected && item.status !== "archived";
  });
}

function clearSelectedRows() {
  selectedRowKeys.value = [];
}

// ──────────────────────────────────────────────────────────────
// V0.x 修订：点击行空白区域直接切换选中，等效于点击复选框 - RB-019
// ──────────────────────────────────────────────────────────────
// 行点击选中：仅空白区域生效，交互元素（链接/按钮/复选框/状态 Tag）不触发
// 归档记录复选框被禁用，行点击同样禁止选中，保持两种入口行为一致
function handleRowClick(record, event) {
  if (record.status === "archived") {
    return;
  }
  const functional = event.target.closest(
    "a, button, input, .ant-checkbox-wrapper, .ant-tag"
  );
  if (functional) {
    return;
  }
  const index = selectedRowKeys.value.indexOf(record.id);
  if (index >= 0) {
    selectedRowKeys.value.splice(index, 1);
  } else {
    selectedRowKeys.value.push(record.id);
  }
}

// customRow 以函数形式挂事件，避免模板内联事件与 bodyCell 插槽冲突
function customRow(record) {
  return {
    onClick: (event) => handleRowClick(record, event),
  };
}

// 主按钮执行默认批量操作：将选中记录统一切换为已发布
function handleBatchPublish() {
  const records = getSelectedRecords();
  records.forEach((record) => {
    record.status = "published";
  });
  message.success(`已批量发布 ${records.length} 条记录`);
  clearSelectedRows();
}

// 下拉菜单承载危险批量操作，归档前必须二次确认
function handleBatchMenu({ key }) {
  if (key !== "archive") {
    return;
  }
  const records = getSelectedRecords();
  Modal.confirm({
    title: `确认归档已选择的 ${records.length} 条记录？`,
    content: "归档操作不可逆，请确认是否继续。",
    okText: "确认",
    cancelText: "取消",
    onOk() {
      records.forEach((record) => {
        record.status = "archived";
      });
      message.success(`已批量归档 ${records.length} 条记录`);
      clearSelectedRows();
    },
  });
}

// ──────────────────────────────────────────────────────────────
// 表格列定义
// 操作列固定靠右，宽度 130px 容纳"编辑 + 修改"两个链接按钮
// ──────────────────────────────────────────────────────────────
const columns = [
  { title: "编号", dataIndex: "id", width: 140 },
  { title: "名称", dataIndex: "name" },
  { title: "状态", dataIndex: "status", width: 120 },
  { title: "创建时间", dataIndex: "createTime", width: 180 },
  { title: "操作", key: "action", fixed: "right", width: 130 },
];

// ──────────────────────────────────────────────────────────────
// 状态 Tag 颜色映射
// 直接读 EXAMPLE_STATUS 枚举的 color 字段，避免在视图中散落硬编码
// ──────────────────────────────────────────────────────────────
function statusColor(value) {
  const item = EXAMPLE_STATUS.find((opt) => opt.value === value);
  return item ? item.color : "default";
}

// 状态切换：a-dropdown 排除当前状态后列出其余选项
// 危险操作（如"归档"）在 handleStatusChange 内用 Modal.confirm 二次确认
function handleStatusChange(record, newValue) {
  // 归档是终态，逻辑层再次拦截可避免绕过界面触发状态回退
  if (record.status === "archived") {
    return;
  }
  const newLabel = findEnumLabel(EXAMPLE_STATUS, newValue);
  // 归档为不可逆操作，二次确认避免误触
  if (newValue === "archived") {
    Modal.confirm({
      title: `确认将「${record.name}」切换为「${newLabel}」？`,
      content: "归档操作不可逆，请确认是否继续。",
      okText: "确认",
      cancelText: "取消",
      onOk() {
        record.status = newValue;
        message.success(`已切换为 ${newLabel} 状态`);
      },
    });
    return;
  }
  record.status = newValue;
  message.success(`已切换为 ${newLabel} 状态`);
}

// ──────────────────────────────────────────────────────────────
// 弹窗状态：新建 / 编辑共用一个弹窗组件实例
// mode 区分新建/编辑，影响标题与 status 字段是否只读
// ──────────────────────────────────────────────────────────────
const modalOpen = ref(false);
const modalMode = ref("create"); // "create" | "edit"
const editingId = ref(null);

// 弹窗动态标题：新建/编辑用同一弹窗，靠 mode 切换标题
const modalTitle = computed(() =>
  modalMode.value === "create" ? "新建示例记录" : "编辑示例记录"
);

// 只读状态提示按新建默认态与归档终态分别说明原因
const readonlyStatusHint = computed(() => {
  if (modalMode.value === "create") {
    return "新建记录默认状态，不可修改";
  }
  return "已归档记录状态不可修改";
});

// 编辑表单不提供归档入口，确保不可逆操作统一经过列表二次确认
const editableStatusOptions = computed(() => {
  return EXAMPLE_STATUS.filter((item) => item.value !== "archived");
});

// 表单数据：字段顺序与新建/编辑保持一致
// status 在新建模式下默认 draft；编辑时仅非归档状态允许切换
const formRef = ref(null);
const formData = reactive({
  name: "",
  status: "draft",
});

// 表单校验规则：必填字段必须显式挂 :rules，接入 AntD validate 链路
// 仅 required 视觉星号写法会导致"看着像必填、提交时静默通过"的缺陷
const formRules = {
  name: [
    { required: true, message: "请输入名称", trigger: "blur" },
    { max: 50, message: "名称不超过 50 字", trigger: "blur" },
  ],
};

// 打开新建弹窗：重置表单为默认值，status 固定为 draft
function openCreateModal() {
  modalMode.value = "create";
  editingId.value = null;
  formData.name = "";
  formData.status = "draft";
  modalOpen.value = true;
}

// 打开编辑弹窗：回填当前记录数据，status 可选
function openEditModal(record) {
  modalMode.value = "edit";
  editingId.value = record.id;
  formData.name = record.name;
  formData.status = record.status;
  modalOpen.value = true;
}

// ──────────────────────────────────────────────────────────────
// V0.x 修订：名称列点击查看弹窗，只读展示当前记录 - RB-018
// ──────────────────────────────────────────────────────────────
const viewModalOpen = ref(false);
const viewingRecord = ref(null);

// 查看弹窗只读不回填表单，直接持有当前记录引用即可
function openViewModal(record) {
  viewingRecord.value = record;
  viewModalOpen.value = true;
}

// 关闭弹窗：重置表单与校验状态，避免下次打开残留红色错误提示
function handleClose() {
  modalOpen.value = false;
  formRef.value?.resetFields();
}

// ──────────────────────────────────────────────────────────────
// 2026-07-22 修订：标准尺寸修改弹窗与近全屏编辑弹窗分离，便于对照两种弹窗规格
// ──────────────────────────────────────────────────────────────
const standardModalOpen = ref(false);
const standardFormRef = ref(null);
const standardEditingId = ref(null);
const standardFormData = reactive({
  name: "",
  status: "draft",
});

// 标准弹窗打开时回填当前记录，不与近全屏弹窗共享可变表单状态
function openStandardModal(record) {
  standardEditingId.value = record.id;
  standardFormData.name = record.name;
  standardFormData.status = record.status;
  standardModalOpen.value = true;
}

// 统一处理取消按钮、关闭图标和遮罩关闭产生的 open 状态变化
function handleStandardOpenChange(open) {
  standardModalOpen.value = open;
  if (!open) {
    standardFormRef.value?.resetFields();
  }
}

// 标准弹窗保存：校验通过后就地更新当前记录，保持列表响应式引用稳定
function handleStandardSubmit() {
  standardFormRef.value
    .validate()
    .then(() => {
      const record = exampleList.find(
        (item) => item.id === standardEditingId.value
      );
      if (record) {
        record.name = standardFormData.name;
        record.status = standardFormData.status;
      }
      message.success("保存成功");
      handleStandardOpenChange(false);
    })
    .catch(() => {
      // 标准弹窗仅两个字段，均在视口内，可按规范省略自动滚动
      message.warning("请完善必填项后再操作");
    });
}

// ──────────────────────────────────────────────────────────────
// 提交处理：校验失败统一三项行为（Toast + 字段红框 + 滚动定位）
// 对应 vue-ui-implementation.mdc ## 表单校验失败的统一行为
// ──────────────────────────────────────────────────────────────
function handleSubmit() {
  formRef.value
    .validate()
    .then(() => {
      if (modalMode.value === "create") {
        // 新建：push 到 reactive 数组，computed 自动重新排序
        exampleList.push({
          id: nextExampleId(),
          name: formData.name,
          status: formData.status,
          // 创建时间用本地当前时刻，与列表默认排序字段对齐
          createTime: new Date()
            .toISOString()
            .replace("T", " ")
            .substring(0, 19),
        });
        message.success("保存成功");
      } else {
        // 编辑：找到原记录就地更新，保持数组引用稳定
        const record = exampleList.find((item) => item.id === editingId.value);
        if (record) {
          record.name = formData.name;
          record.status = formData.status;
        }
        message.success("保存成功");
      }
      handleClose();
    })
    .catch((errorInfo) => {
      // 校验失败统一处理：Toast + 滚动定位（字段级红框由 AntD 自动渲染）
      message.warning("请完善必填项后再操作");
      const firstField = errorInfo?.errorFields?.[0]?.name;
      if (firstField && formRef.value?.scrollToField) {
        // block: center 避免被固定标题栏遮挡
        formRef.value.scrollToField(firstField, {
          behavior: "smooth",
          block: "center",
        });
      }
    });
}
</script>

<template>
  <div class="page-stack">
    <!-- 筛选卡：查询/重置始终可见，不折叠 -->
    <a-card class="filter-card">
      <a-form layout="inline">
        <a-form-item label="名称">
          <a-input
            v-model:value="filters.name"
            placeholder="请输入名称"
            allow-clear
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="filters.status"
            placeholder="请选择状态"
            allow-clear
            :options="EXAMPLE_STATUS"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item>
          <a-space :size="8">
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 2026-07-22 修订：顶部用 11px 抵消 Header 与 Body 的 1px 边框重叠，确保视觉间距为 10px -->
    <a-card :body-style="{ padding: '11px 10px 10px' }">
      <template #extra>
        <a-space :size="8">
          <!-- 批量按钮无选中项时禁用；主按钮发布，下拉菜单提供归档 -->
          <a-dropdown-button
            :disabled="!hasSelectedRows"
            @click="handleBatchPublish"
          >
            发布
            <template #icon><EllipsisOutlined /></template>
            <template #overlay>
              <a-menu @click="handleBatchMenu">
                <a-menu-item key="archive">归档</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown-button>
          <a-button type="primary" @click="openCreateModal">
            <template #icon><PlusOutlined /></template>
            新建
          </a-button>
        </a-space>
      </template>

      <!-- 2026-07-22 修订：选择后在分页区域左侧提供显式取消入口 -->
      <div class="table-selection-wrap">
        <a-table
        :columns="columns"
        :data-source="filteredList"
        :row-selection="rowSelection"
        :custom-row="customRow"
        row-key="id"
        size="middle"
        :pagination="{
          defaultPageSize: 10,
          showTotal: (total) => `共 ${total} 条数据`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '30', '50'],
          showQuickJumper: true,
        }"
      >
        <!-- 状态列：a-dropdown 包裹 Tag，排除当前状态后列出其余选项 -->
        <template #bodyCell="{ column, record }">
          <!-- 名称列：可点击单元格，使用统一链接视觉，点击查看弹窗 -->
          <template v-if="column.dataIndex === 'name'">
            <a class="link-cell" @click="openViewModal(record)">
              {{ record.name }}
            </a>
          </template>

          <template v-else-if="column.dataIndex === 'status'">
            <a-dropdown
              v-if="record.status !== 'archived'"
              :trigger="['click']"
            >
              <a-tag
                :color="statusColor(record.status)"
                class="status-switch-tag"
              >
                {{ findEnumLabel(EXAMPLE_STATUS, record.status) }}
                <SwapOutlined class="status-switch-icon" />
              </a-tag>
              <template #overlay>
                <a-menu
                  @click="(e) => handleStatusChange(record, e.key)"
                  :items="
                    EXAMPLE_STATUS.filter((opt) => opt.value !== record.status).map(
                      (opt) => ({ key: opt.value, label: opt.label })
                    )
                  "
                />
              </template>
            </a-dropdown>
            <!-- 已归档为终态，只展示不可交互标签，避免误导用户仍可切换 -->
            <a-tag v-else :color="statusColor(record.status)">
              {{ findEnumLabel(EXAMPLE_STATUS, record.status) }}
            </a-tag>
          </template>

          <!-- 操作列：type="link" 行内按钮，不带图标，保持紧凑 -->
          <template v-else-if="column.key === 'action'">
            <a-space :size="4">
              <a-button type="link" size="small" @click="openEditModal(record)">
                编辑
              </a-button>
              <a-button
                type="link"
                size="small"
                @click="openStandardModal(record)"
              >
                修改
              </a-button>
            </a-space>
          </template>
        </template>
        </a-table>
        <a-button
          v-if="hasSelectedRows"
          class="selection-cancel-button"
          @click="clearSelectedRows"
        >
          取消选择
        </a-button>
      </div>
    </a-card>

    <!-- 新建/编辑弹窗：近全屏弹窗变体一，四周留 24px 间距 -->
    <a-modal
      :open="modalOpen"
      :title="modalTitle"
      width="calc(100vw - 48px)"
      :footer="null"
      :mask-closable="false"
      wrap-class-name="example-modal"
      @update:open="(val) => (modalOpen = val)"
    >
      <div class="modal-body-scroll">
        <a-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          layout="vertical"
        >
          <a-form-item label="名称" name="name" :rules="formRules.name">
            <a-input
              v-model:value="formData.name"
              placeholder="请输入名称"
              :maxlength="50"
            />
          </a-form-item>

          <a-form-item label="状态" name="status">
            <!-- 新建模式：status 默认 draft 且只读，用 a-tag + 灰色提示展示 -->
            <!-- 编辑模式：非归档状态可选；已归档终态继续只读展示 -->
            <div
              v-if="modalMode === 'create' || formData.status === 'archived'"
              class="readonly-status-wrap"
            >
              <a-tag :color="statusColor(formData.status)">
                {{ findEnumLabel(EXAMPLE_STATUS, formData.status) }}
              </a-tag>
              <span class="readonly-status-hint">{{ readonlyStatusHint }}</span>
            </div>
            <a-select
              v-else
              v-model:value="formData.status"
              :options="editableStatusOptions"
              style="width: 100%"
            />
          </a-form-item>
        </a-form>
      </div>
      <div class="modal-footer">
        <!-- 2026-07-22 修订：仅有常规操作时统一放入右侧分区，保持底部操作靠右 -->
        <div class="modal-footer__right">
          <a-button @click="handleClose">取消</a-button>
          <a-button type="primary" @click="handleSubmit">保存</a-button>
        </div>
      </div>
    </a-modal>

    <!-- 2026-07-22 修订：标准弹窗采用 1200×600 完整框体，小视口按安全边距自动收缩 -->
    <a-modal
      :open="standardModalOpen"
      title="修改示例记录"
      width="1200px"
      ok-text="保存"
      cancel-text="取消"
      centered
      :mask-closable="false"
      wrap-class-name="standard-example-modal"
      @ok="handleStandardSubmit"
      @update:open="handleStandardOpenChange"
    >
      <a-form
        ref="standardFormRef"
        :model="standardFormData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item label="名称" name="name" :rules="formRules.name">
          <a-input
            v-model:value="standardFormData.name"
            placeholder="请输入名称"
            :maxlength="50"
          />
        </a-form-item>

        <a-form-item label="状态" name="status">
          <div
            v-if="standardFormData.status === 'archived'"
            class="readonly-status-wrap"
          >
            <a-tag :color="statusColor(standardFormData.status)">
              {{ findEnumLabel(EXAMPLE_STATUS, standardFormData.status) }}
            </a-tag>
            <span class="readonly-status-hint">已归档记录状态不可修改</span>
          </div>
          <a-select
            v-else
            v-model:value="standardFormData.status"
            :options="editableStatusOptions"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看弹窗：仅 4 个只读字段，采用最小足够的默认宽度；Descriptions 只读展示，不用禁用输入框伪装 -->
    <a-modal
      :open="viewModalOpen"
      title="查看示例记录"
      wrap-class-name="view-example-modal"
      @update:open="(val) => (viewModalOpen = val)"
    >
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="编号">
          {{ viewingRecord?.id }}
        </a-descriptions-item>
        <a-descriptions-item label="名称">
          {{ viewingRecord?.name }}
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="statusColor(viewingRecord?.status)">
            {{ findEnumLabel(EXAMPLE_STATUS, viewingRecord?.status) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          {{ viewingRecord?.createTime }}
        </a-descriptions-item>
      </a-descriptions>
      <template #footer>
        <!-- 查看弹窗无业务操作，仅保留关闭 -->
        <a-button @click="viewModalOpen = false">关闭</a-button>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
/* 弹窗内表单受 .modal-body-scroll 滚动容器约束，左右留白 40px 保证视觉不挤 */
/* 全屏弹窗样式（.example-modal 等）放在 global.css 中，因 scoped 选择器无法穿透 wrap-class-name */
.status-switch-tag {
  cursor: pointer;
  user-select: none;
}

/* 切换图标保持弱提示，既表明可操作又不抢占状态文字视觉层级 */
.status-switch-icon {
  margin-left: 4px;
  font-size: 11px;
  opacity: 0.7;
}

/* 取消选择按钮叠放在分页区域左侧，不额外撑高列表卡片 */
.table-selection-wrap {
  position: relative;
}

.selection-cancel-button {
  position: absolute;
  left: 0;
  /* 分页项高 24px、按钮高 32px，底部 12px 可使两者中心线对齐 */
  bottom: 12px;
  z-index: 2;
}
</style>
