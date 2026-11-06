<script setup>
import { ref, reactive, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import dayjs from "dayjs";
import {
  EllipsisOutlined,
  PlusOutlined,
  SwapOutlined,
} from "@ant-design/icons-vue";
import FilterBar from "../../components/FilterBar.vue";
import { useRowMotion } from "../../composables/useRowMotion";
import {
  exampleList,
  exampleGroupTree,
  exampleGroupPathMap,
  nextExampleId,
} from "../../mock/example";
import {
  EXAMPLE_STATUS,
  EXAMPLE_CATEGORY,
  findEnumLabel,
} from "../../mock/enums";

// ──────────────────────────────────────────────────────────────
// FIX-003 修订：示例记录新增所属分组，列表与查看弹窗显示完整路径
// 不同区域下可能存在同名分部或站点，只显示节点名称会无法区分
// R3 P3-003 修订：路径映射改由 mock 统一导出，与分组列表共用同一份口径
// ──────────────────────────────────────────────────────────────
const groupPathMap = exampleGroupPathMap;

// 分组树节点以 key/title 命名，树形下拉按 value/label 读取，需显式映射
const groupFieldNames = { label: "title", value: "key", children: "children" };

// R3 TBD-002 修订（方案 A）：下拉中仍按节点名称逐级浏览，选中后回显完整路径，
// 与列表、查看弹窗口径一致；复制节点附加 pathLabel，避免改动只读的共享分组树
function buildGroupSelectTree(nodes) {
  return nodes.map((node) => {
    const option = {
      key: node.key,
      title: node.title,
      pathLabel: exampleGroupPathMap[node.key],
    };
    if (node.children) {
      option.children = buildGroupSelectTree(node.children);
    }
    return option;
  });
}
const groupSelectTree = buildGroupSelectTree(exampleGroupTree);

// 新建 / 编辑 / 快速编辑：所属分组下拉支持输入关键字过滤，匹配节点名称或完整路径
function filterGroupTreeNode(inputValue, treeNode) {
  const keyword = String(inputValue || "").trim().toLowerCase();
  if (!keyword) {
    return true;
  }
  const node = treeNode.dataRef || treeNode;
  const title = String(node.title || "").toLowerCase();
  const pathLabel = String(node.pathLabel || "").toLowerCase();
  return title.includes(keyword) || pathLabel.includes(keyword);
}

// ──────────────────────────────────────────────────────────────
// 筛选状态：搜索栏字段
// ──────────────────────────────────────────────────────────────
// V0.x 修订：新增创建时间范围筛选，按天选择 - RB-026
// createTimeRange 为 ["YYYY-MM-DD", "YYYY-MM-DD"]，未选择时为 undefined
// V0.x 修订：分类筛选为单选下拉，与状态控件一致 - RB-039（原多选改为单选）
const filters = reactive({
  name: "",
  status: undefined,
  category: undefined,
  createTimeRange: undefined,
});

// P2-04 修订：编辑态与已提交态分离，避免输入过程中列表提前变化
const appliedFilters = reactive({
  name: "",
  status: undefined,
  category: undefined,
  createTimeRange: undefined,
});

// 查询时才提交筛选条件，让按钮承担明确的查询触发职责
function handleSearch() {
  appliedFilters.name = filters.name.trim();
  appliedFilters.status = filters.status;
  appliedFilters.category = filters.category;
  appliedFilters.createTimeRange = filters.createTimeRange;
  resetListView();
}

// 重置时同步清空编辑态和已提交态，列表立即回到全量
function handleReset() {
  filters.name = "";
  filters.status = undefined;
  filters.category = undefined;
  filters.createTimeRange = undefined;
  appliedFilters.name = "";
  appliedFilters.status = undefined;
  appliedFilters.category = undefined;
  appliedFilters.createTimeRange = undefined;
  resetListView();
}

// R2 P2-001 / TBD-001 修订：结果集变化后原页码可能越界，已选记录也可能不在新结果中，
// 统一回到第 1 页并清空选择，避免批量操作作用于当前列表看不到的记录
function resetListView() {
  pagination.current = 1;
  clearSelectedRows();
}

// 按天筛选需包含起止两天整天，故只取 createTime 的日期部分比较；
// 两侧均为 YYYY-MM-DD 格式，字符串比较即等价于日期比较
function matchCreateTimeRange(createTime) {
  const range = appliedFilters.createTimeRange;
  if (!range || range.length !== 2) {
    return true;
  }
  const createDate = createTime.slice(0, 10);
  const afterStart = createDate >= range[0];
  const beforeEnd = createDate <= range[1];
  return afterStart && beforeEnd;
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
    const matchCategory = appliedFilters.category
      ? item.category === appliedFilters.category
      : true;
    const matchTime = matchCreateTimeRange(item.createTime);
    return matchName && matchStatus && matchCategory && matchTime;
  });
  // 字符串日期 ISO 格式可直接 localeCompare 降序
  list = list.sort((a, b) => b.createTime.localeCompare(a.createTime));
  return list;
});

// R2 P2-001 修订：分页改为受控，查询、重置才能主动回到第 1 页（与分组列表口径一致）
const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const tablePagination = computed(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  showTotal: (total) => `共 ${total} 条数据`,
  showSizeChanger: true,
  pageSizeOptions: ["10", "20", "30", "50"],
  showQuickJumper: true,
}));

// 翻页与切换每页条数都经由此回传，保持受控状态与表格一致
function handleTableChange(page) {
  pagination.current = page.current;
  pagination.pageSize = page.pageSize;
}

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

// ──────────────────────────────────────────────────────────────
// 表格行动画：新增进场、修改高亮、删除出场 - vue-list-view.mdc ## 表格行动画
// ──────────────────────────────────────────────────────────────
const { playEnter, playUpdate, playLeave, rowMotionClass } = useRowMotion();

function rowClassName(record) {
  return rowMotionClass(record.id);
}

// 主按钮执行默认批量操作：将选中记录统一切换为已发布
function handleBatchPublish() {
  const records = getSelectedRecords();
  records.forEach((record) => {
    record.status = "published";
  });
  playUpdate(records.map((record) => record.id));
  message.success(`已批量发布 ${records.length} 条记录`);
  clearSelectedRows();
}

// ──────────────────────────────────────────────────────────────
// V0.x 修订：新增删除，仅草稿可删除，删除前二次确认 - RB-033
// 已发布、已归档记录已对外生效或已终止，删除会丢失业务痕迹，故不允许
// ──────────────────────────────────────────────────────────────
function canDelete(record) {
  return record.status === "draft";
}

// 先播放出场动画再移除数据；同步移出勾选，避免已选条数统计到不存在的记录
function removeRecords(ids) {
  playLeave(ids, () => {
    ids.forEach((id) => {
      const index = exampleList.findIndex((item) => item.id === id);
      if (index >= 0) {
        exampleList.splice(index, 1);
      }
    });
    selectedRowKeys.value = selectedRowKeys.value.filter(
      (key) => !ids.includes(key)
    );
  });
}

function handleDelete(record) {
  // 逻辑层再次拦截，防止绕过按钮禁用态删除非草稿记录
  if (!canDelete(record)) {
    return;
  }
  Modal.confirm({
    title: `确认删除「${record.name}」？`,
    content: "删除后不可恢复，请确认是否继续。",
    okText: "确认",
    cancelText: "取消",
    onOk() {
      removeRecords([record.id]);
      message.success("示例记录已删除");
    },
  });
}

// 批量删除只处理草稿，已发布记录跳过；确认弹窗写明删除与跳过条数，避免用户误以为全部删除
// 混选口径见 SRS §5.6.4 - RB-033
function handleBatchDelete() {
  const records = getSelectedRecords();
  const deletable = records.filter((record) => canDelete(record));
  if (deletable.length === 0) {
    message.warning("已选记录中没有可删除的草稿记录");
    return;
  }
  const skipped = records.length - deletable.length;
  let content = "删除后不可恢复，请确认是否继续。";
  if (skipped > 0) {
    content = `其中 ${skipped} 条非草稿记录不可删除，将被跳过。删除后不可恢复，请确认是否继续。`;
  }
  Modal.confirm({
    title: `确认删除已选择的 ${deletable.length} 条草稿记录？`,
    content,
    okText: "确认",
    cancelText: "取消",
    onOk() {
      removeRecords(deletable.map((record) => record.id));
      message.success(`已批量删除 ${deletable.length} 条记录`);
      clearSelectedRows();
    },
  });
}

// 下拉菜单承载危险批量操作，归档、删除前必须二次确认
function handleBatchMenu({ key }) {
  if (key === "delete") {
    handleBatchDelete();
    return;
  }
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
      playUpdate(records.map((record) => record.id));
      message.success(`已批量归档 ${records.length} 条记录`);
      clearSelectedRows();
    },
  });
}

// ──────────────────────────────────────────────────────────────
// 表格列定义
// 操作列固定靠右，宽度 210px 容纳"编辑 + 快速编辑 + 删除"三个链接按钮 - RB-033
// 模板中 scroll.x 取各列宽之和加名称列最小宽度：窄屏改为横向滚动，
// 避免未定宽的名称列被挤成每行一个字，fixed 操作列也依赖它才生效
// FIX-003 修订：新增 240px 所属分组列，scroll.x 由 920 同步增至 1160
// ──────────────────────────────────────────────────────────────
const columns = [
  { title: "编号", dataIndex: "id", width: 140 },
  { title: "名称", dataIndex: "name" },
  { title: "分类", dataIndex: "category", width: 120 },
  { title: "所属分组", dataIndex: "groupKey", width: 240 },
  { title: "状态", dataIndex: "status", width: 120 },
  { title: "创建时间", dataIndex: "createTime", width: 180 },
  { title: "操作", key: "action", fixed: "right", width: 210 },
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
        // R2 P2-002 修订：归档后复选框被禁用，必须同步移出已选，否则批量操作会混入终态记录
        selectedRowKeys.value = selectedRowKeys.value.filter(
          (key) => key !== record.id
        );
        playUpdate([record.id]);
        message.success(`已切换为 ${newLabel} 状态`);
      },
    });
    return;
  }
  record.status = newValue;
  playUpdate([record.id]);
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
  category: undefined,
  groupKey: undefined,
  status: "draft",
});

// 表单校验规则：必填字段必须显式挂 :rules，接入 AntD validate 链路
// 仅 required 视觉星号写法会导致"看着像必填、提交时静默通过"的缺陷
// R2 P2-003 修订：whitespace 使仅含空格的名称同样判为未填写，避免生成空白名称记录
const formRules = {
  name: [
    { required: true, whitespace: true, message: "请输入名称", trigger: "blur" },
    { max: 50, message: "名称不超过 50 字", trigger: "blur" },
  ],
  // 下拉选择没有 blur 输入过程，选中即校验，故用 change 触发
  category: [{ required: true, message: "请选择分类", trigger: "change" }],
  // FIX-003 修订：每条记录必须归属一个分组，否则在分组列表中只能从「全部」找到
  groupKey: [
    { required: true, message: "请选择所属分组", trigger: "change" },
  ],
};

// 打开新建弹窗：重置表单为默认值，status 固定为 draft
function openCreateModal() {
  modalMode.value = "create";
  editingId.value = null;
  formData.name = "";
  formData.category = undefined;
  formData.groupKey = undefined;
  formData.status = "draft";
  modalOpen.value = true;
}

// 打开编辑弹窗：回填当前记录数据，status 可选
function openEditModal(record) {
  modalMode.value = "edit";
  editingId.value = record.id;
  formData.name = record.name;
  formData.category = record.category;
  formData.groupKey = record.groupKey;
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

// 模板内禁止直接给 ref 赋值，关闭动作收口到具名函数
function closeViewModal() {
  viewModalOpen.value = false;
}

// R3 P3-004 修订：关闭图标与遮罩回传的 open 状态同样经具名函数写入，与分组列表一致
function handleViewOpenChange(open) {
  viewModalOpen.value = open;
}

// 关闭弹窗：只切换 open，表单重置交给关闭动画结束后的 resetForm
function handleClose() {
  modalOpen.value = false;
}

// R3 P3-004 修订：近全屏弹窗关闭图标回传的 open 状态经具名函数写入
function handleModalOpenChange(open) {
  modalOpen.value = open;
}

// 关闭动画期间弹窗仍可见，立即重置会闪现空值和校验红字，故延后到 after-close
// 同时覆盖取消、关闭图标与保存三条关闭路径，避免下次打开残留校验状态
function resetForm() {
  formRef.value?.resetFields();
}

// ──────────────────────────────────────────────────────────────
// 2026-07-22 修订：标准尺寸快速编辑弹窗与近全屏编辑弹窗分离，便于对照两种弹窗规格
// V1.2 修订：入口由"修改"更名为"快速编辑"，避免与"编辑"成为同义按钮 - SRS §5.2
// ──────────────────────────────────────────────────────────────
const standardModalOpen = ref(false);
const standardFormRef = ref(null);
const standardEditingId = ref(null);
const standardFormData = reactive({
  name: "",
  category: undefined,
  groupKey: undefined,
  status: "draft",
});

// 标准弹窗打开时回填当前记录，不与近全屏弹窗共享可变表单状态
function openStandardModal(record) {
  standardEditingId.value = record.id;
  standardFormData.name = record.name;
  standardFormData.category = record.category;
  standardFormData.groupKey = record.groupKey;
  standardFormData.status = record.status;
  standardModalOpen.value = true;
}

// 统一处理取消按钮、关闭图标和遮罩关闭产生的 open 状态变化
function handleStandardOpenChange(open) {
  standardModalOpen.value = open;
}

// 自定义底部的「取消」不经过 a-modal 内置事件，需显式关闭
function closeStandardModal() {
  handleStandardOpenChange(false);
}

// 与近全屏弹窗一致：关闭动画结束后再重置，避免闪现修改前的旧值
function resetStandardForm() {
  standardFormRef.value?.resetFields();
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
        record.name = standardFormData.name.trim();
        record.category = standardFormData.category;
        record.groupKey = standardFormData.groupKey;
        record.status = standardFormData.status;
        playUpdate([record.id]);
      }
      message.success("保存成功");
      handleStandardOpenChange(false);
    })
    .catch((errorInfo) => {
      message.warning("请完善必填项后再操作");
      // FIX-003 修订：新增所属分组后字段增至 4 个，超出规范允许省略滚动的 3 个上限
      const firstField = errorInfo?.errorFields?.[0]?.name;
      if (firstField && standardFormRef.value?.scrollToField) {
        standardFormRef.value.scrollToField(firstField, {
          behavior: "smooth",
          block: "center",
        });
      }
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
        const newId = nextExampleId();
        // 名称去除首尾空格后入库，与查询侧的 trim 口径一致
        exampleList.push({
          id: newId,
          name: formData.name.trim(),
          category: formData.category,
          groupKey: formData.groupKey,
          status: formData.status,
          // 必须按本地时区格式化：toISOString 输出 UTC，会比 Mock 种子数据慢 8 小时
          createTime: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        });
        playEnter(newId);
        message.success("保存成功");
      } else {
        // 编辑：找到原记录就地更新，保持数组引用稳定
        const record = exampleList.find((item) => item.id === editingId.value);
        if (record) {
          record.name = formData.name.trim();
          record.category = formData.category;
          record.groupKey = formData.groupKey;
          record.status = formData.status;
          playUpdate([record.id]);
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
    <!-- 筛选卡：查询/重置始终可见；一行放不下时由 FilterBar 提供展开/收起 - RB-032 -->
    <a-card class="filter-card">
      <FilterBar @search="handleSearch" @reset="handleReset">
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
        <!-- 分类：普通单选下拉，口径与状态筛选一致 - RB-039 -->
        <a-form-item label="分类">
          <a-select
            v-model:value="filters.category"
            placeholder="请选择分类"
            allow-clear
            :options="EXAMPLE_CATEGORY"
            style="width: 200px"
          />
        </a-form-item>
        <!-- 创建时间范围：按天选择，起止两天均包含在内 - RB-026 -->
        <a-form-item label="创建时间">
          <a-range-picker
            v-model:value="filters.createTimeRange"
            value-format="YYYY-MM-DD"
            :placeholder="['开始日期', '结束日期']"
            style="width: 260px"
          />
        </a-form-item>
      </FilterBar>
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
                <a-menu-item key="delete" danger>删除</a-menu-item>
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
        :row-class-name="rowClassName"
        row-key="id"
        size="middle"
        :scroll="{ x: 1160 }"
        :pagination="tablePagination"
        @change="handleTableChange"
      >
        <!-- 状态列：a-dropdown 包裹 Tag，排除当前状态后列出其余选项 -->
        <template #bodyCell="{ column, record }">
          <!-- 名称列：可点击单元格，使用统一链接视觉，点击查看弹窗 -->
          <template v-if="column.dataIndex === 'name'">
            <a class="link-cell" @click="openViewModal(record)">
              {{ record.name }}
            </a>
          </template>

          <!-- 分类列：无状态语义，纯文本回显中文名称 -->
          <template v-else-if="column.dataIndex === 'category'">
            {{ findEnumLabel(EXAMPLE_CATEGORY, record.category) }}
          </template>

          <!-- 所属分组列：显示完整路径，与分组列表口径一致 - FIX-003 -->
          <template v-else-if="column.dataIndex === 'groupKey'">
            {{ groupPathMap[record.groupKey] }}
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
                快速编辑
              </a-button>
              <!-- 非草稿置灰并说明原因；禁用按钮不触发鼠标事件，需外包 span 才能显示提示，
                   span 阻止冒泡，避免点在禁用按钮上误触发行选中 -->
              <a-button
                v-if="canDelete(record)"
                type="link"
                size="small"
                danger
                @click="handleDelete(record)"
              >
                删除
              </a-button>
              <a-tooltip v-else title="仅草稿记录可删除">
                <span @click.stop>
                  <a-button type="link" size="small" danger disabled>
                    删除
                  </a-button>
                </span>
              </a-tooltip>
            </a-space>
          </template>
        </template>
        </a-table>
        <!-- V0.x 修订：取消选择右侧显示已选条数，让用户在批量操作前确认范围 - RB-030 -->
        <div v-if="hasSelectedRows" class="selection-bar">
          <a-button @click="clearSelectedRows">取消选择</a-button>
          <span class="selection-count">已选 {{ selectedRowKeys.length }} 条</span>
        </div>
      </div>
    </a-card>

    <!-- 新建/编辑弹窗：近全屏弹窗变体一，四周留 24px 间距 -->
    <!-- 宽度扣除 AI 面板占用宽度，面板打开时弹窗在剩余区域内居中、不钻到面板下方 - RB-021 -->
    <a-modal
      :open="modalOpen"
      :title="modalTitle"
      width="calc(100vw - var(--ai-panel-offset, 0px) - 48px)"
      :footer="null"
      :mask-closable="false"
      wrap-class-name="example-modal"
      :after-close="resetForm"
      @update:open="handleModalOpenChange"
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

          <!-- 每条记录只归属一个分类；搜索栏与表单均为单选下拉 -->
          <a-form-item label="分类" name="category" :rules="formRules.category">
            <a-select
              v-model:value="formData.category"
              placeholder="请选择分类"
              :options="EXAMPLE_CATEGORY"
              style="width: 100%"
            />
          </a-form-item>

          <!-- 所属分组可选区域、分部、站点任意层级，默认展开便于直接定位深层站点 - FIX-003 -->
          <a-form-item label="所属分组" name="groupKey" :rules="formRules.groupKey">
            <a-tree-select
              v-model:value="formData.groupKey"
              placeholder="请选择所属分组"
              show-search
              :filter-tree-node="filterGroupTreeNode"
              :tree-data="groupSelectTree"
              :field-names="groupFieldNames"
              tree-node-label-prop="pathLabel"
              tree-default-expand-all
              style="width: 100%"
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
      title="快速编辑示例记录"
      width="1200px"
      centered
      :mask-closable="false"
      wrap-class-name="standard-example-modal"
      :after-close="resetStandardForm"
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

        <a-form-item label="分类" name="category" :rules="formRules.category">
          <a-select
            v-model:value="standardFormData.category"
            placeholder="请选择分类"
            :options="EXAMPLE_CATEGORY"
            style="width: 100%"
          />
        </a-form-item>

        <!-- 字段顺序与近全屏编辑弹窗一致 - FIX-003 -->
        <a-form-item label="所属分组" name="groupKey" :rules="formRules.groupKey">
          <a-tree-select
            v-model:value="standardFormData.groupKey"
            placeholder="请选择所属分组"
            show-search
            :filter-tree-node="filterGroupTreeNode"
            :tree-data="groupSelectTree"
            :field-names="groupFieldNames"
            tree-node-label-prop="pathLabel"
            tree-default-expand-all
            style="width: 100%"
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
      <!-- R2 P3-004 修订：底部操作统一放入右侧分区，与近全屏弹窗结构一致 -->
      <template #footer>
        <div class="modal-footer__right">
          <a-button @click="closeStandardModal">取消</a-button>
          <a-button type="primary" @click="handleStandardSubmit">保存</a-button>
        </div>
      </template>
    </a-modal>

    <!-- 查看弹窗：仅少量只读字段，采用最小足够的默认宽度；Descriptions 只读展示，不用禁用输入框伪装 -->
    <a-modal
      :open="viewModalOpen"
      title="查看示例记录"
      wrap-class-name="view-example-modal"
      @update:open="handleViewOpenChange"
    >
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="编号">
          {{ viewingRecord?.id }}
        </a-descriptions-item>
        <a-descriptions-item label="名称">
          {{ viewingRecord?.name }}
        </a-descriptions-item>
        <a-descriptions-item label="分类">
          {{ findEnumLabel(EXAMPLE_CATEGORY, viewingRecord?.category) }}
        </a-descriptions-item>
        <a-descriptions-item label="所属分组">
          {{ groupPathMap[viewingRecord?.groupKey] }}
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
        <!-- 查看弹窗无业务操作，仅保留关闭；R2 P3-004 修订：放入右侧分区 -->
        <div class="modal-footer__right">
          <a-button @click="closeViewModal">关闭</a-button>
        </div>
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

.selection-bar {
  position: absolute;
  left: 0;
  /* 分页项高 24px、按钮高 32px，底部 12px 可使两者中心线对齐 */
  bottom: 12px;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 条数为辅助信息，用次要文字色避免与按钮争夺视觉焦点 */
.selection-count {
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
}
</style>
