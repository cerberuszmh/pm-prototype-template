<script setup>
import { ref, reactive, computed } from "vue";
import { Empty } from "ant-design-vue";
import { SearchOutlined } from "@ant-design/icons-vue";
import FilterBar from "../../components/FilterBar.vue";
// FIX-003 修订：分组记录与示例记录为同一业务对象，直接读取示例列表的共享数据，
// 示例列表中的新建、编辑、删除、状态切换结果在本页同步体现
import {
  exampleGroupTree,
  exampleGroupPathMap,
  exampleList,
} from "../../mock/example";
import {
  EXAMPLE_STATUS,
  EXAMPLE_CATEGORY,
  findEnumLabel,
} from "../../mock/enums";

// ──────────────────────────────────────────────────────────────
// V0.x 修订：左侧分组树筛选右侧列表 - RB-028
// 分组树为静态 Mock，初始化时一次性建立扁平索引，
// 避免每次计数、筛选都递归遍历整棵树
// ──────────────────────────────────────────────────────────────
const descendantKeyMap = {}; // key → 自身及全部下级 key
// R3 P3-003 修订：完整路径改由 mock 统一导出，与示例列表共用同一份口径
const groupPathMap = exampleGroupPathMap;
const allGroupKeys = [];

// 返回本层及以下全部 key，供父节点拼接自己的下级集合
function indexTree(nodes) {
  const collected = [];
  nodes.forEach((node) => {
    allGroupKeys.push(node.key);
    let childKeys = [];
    if (node.children) {
      childKeys = indexTree(node.children);
    }
    descendantKeyMap[node.key] = [node.key, ...childKeys];
    collected.push(node.key, ...childKeys);
  });
  return collected;
}
indexTree(exampleGroupTree);

// ──────────────────────────────────────────────────────────────
// 树状态：选中节点、展开节点、搜索关键词、是否包含下级
// ──────────────────────────────────────────────────────────────
// 「全部」为固定首节点，不属于分组树，选中即不按分组筛选
// key 使用不会与业务分组冲突的保留值
const ALL_KEY = "__all__";

// 默认包含下级：选中区域时直接看到其下全部记录，否则区域节点常为空列表
const includeChildren = ref(true);
// 默认选中「全部」，让用户一进入页面就能看出当前查看范围
const selectedGroupKeys = ref([ALL_KEY]);
const expandedKeys = ref([...allGroupKeys]);
const treeKeyword = ref("");

// 「包含下级」决定一个节点覆盖的分组范围，计数与列表筛选共用同一口径
function getScopeKeys(groupKey) {
  if (includeChildren.value) {
    return descendantKeyMap[groupKey];
  }
  return [groupKey];
}

// 节点计数基于全部记录，不受右侧名称/状态筛选影响，保持树上数字稳定
const groupCountMap = computed(() => {
  const result = {};
  allGroupKeys.forEach((key) => {
    const scopeKeys = getScopeKeys(key);
    const matched = exampleList.filter((item) =>
      scopeKeys.includes(item.groupKey)
    );
    result[key] = matched.length;
  });
  // 「全部」始终为记录总数，与「包含下级」无关
  result[ALL_KEY] = exampleList.length;
  return result;
});

// 自身命中时保留完整子树，便于继续向下浏览；仅子孙命中时保留祖先路径
function filterTree(nodes, keyword) {
  const result = [];
  nodes.forEach((node) => {
    if (node.title.includes(keyword)) {
      result.push(node);
      return;
    }
    let children = [];
    if (node.children) {
      children = filterTree(node.children, keyword);
    }
    if (children.length > 0) {
      result.push({ ...node, children });
    }
  });
  return result;
}

const filteredTreeData = computed(() => {
  const keyword = treeKeyword.value.trim();
  if (!keyword) {
    return exampleGroupTree;
  }
  return filterTree(exampleGroupTree, keyword);
});

// 「全部」是查看范围入口而非分组，搜索分组时不参与过滤，始终置顶
const treeData = computed(() => {
  const allNode = { key: ALL_KEY, title: "全部", isLeaf: true };
  return [allNode, ...filteredTreeData.value];
});

// 搜索时全部展开，保证深层命中节点可见；用户手动折叠过的节点也随之恢复
function handleTreeSearch() {
  expandedKeys.value = [...allGroupKeys];
}

function handleTreeExpand(keys) {
  expandedKeys.value = keys;
}

// 点击节点即时筛选；再次点击已选节点时 AntD 回传空数组，
// 此时回落到「全部」，保证树上始终有一个高亮节点指示当前范围
function handleTreeSelect(keys) {
  if (keys.length === 0) {
    selectedGroupKeys.value = [ALL_KEY];
  } else {
    selectedGroupKeys.value = keys;
  }
  pagination.current = 1;
}

// 范围口径变化后原页码可能越界，统一回到第一页
function handleIncludeChange() {
  pagination.current = 1;
}

// ──────────────────────────────────────────────────────────────
// 右侧筛选：编辑态与已提交态分离，仅点击「查询」后生效
// ──────────────────────────────────────────────────────────────
const filters = reactive({
  name: "",
  status: undefined,
});
const appliedFilters = reactive({
  name: "",
  status: undefined,
});

function handleSearch() {
  appliedFilters.name = filters.name.trim();
  appliedFilters.status = filters.status;
  pagination.current = 1;
}

// 重置只清空筛选卡条件，树选中属于独立的筛选维度，保持不变
function handleReset() {
  filters.name = "";
  filters.status = undefined;
  appliedFilters.name = "";
  appliedFilters.status = undefined;
  pagination.current = 1;
}

// ──────────────────────────────────────────────────────────────
// 列表数据：树范围 × 名称 × 状态 三个条件取交集，按创建时间倒序
// ──────────────────────────────────────────────────────────────
const filteredList = computed(() => {
  const selectedKey = selectedGroupKeys.value[0];
  let scopeKeys = null;
  if (selectedKey && selectedKey !== ALL_KEY) {
    scopeKeys = getScopeKeys(selectedKey);
  }
  const keyword = appliedFilters.name.toLowerCase();
  const list = exampleList.filter((item) => {
    const matchGroup = scopeKeys ? scopeKeys.includes(item.groupKey) : true;
    const matchName = keyword
      ? item.name.toLowerCase().includes(keyword)
      : true;
    const matchStatus = appliedFilters.status
      ? item.status === appliedFilters.status
      : true;
    return matchGroup && matchName && matchStatus;
  });
  // createTime 为 ISO 格式字符串，可直接字符串比较
  return list.sort((a, b) => b.createTime.localeCompare(a.createTime));
});

// 分页受控：树选择、查询、重置都需要主动回到第一页
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

function handleTableChange(page) {
  pagination.current = page.current;
  pagination.pageSize = page.pageSize;
}

// scroll.x 取定宽列之和加名称列最小宽度，窄屏横向滚动而非挤压名称列
const columns = [
  { title: "编号", dataIndex: "id", width: 140 },
  { title: "名称", dataIndex: "name" },
  { title: "所属分组", dataIndex: "groupKey", width: 240 },
  { title: "状态", dataIndex: "status", width: 100 },
  { title: "创建时间", dataIndex: "createTime", width: 180 },
];

function statusColor(value) {
  const item = EXAMPLE_STATUS.find((opt) => opt.value === value);
  return item ? item.color : "default";
}

// ──────────────────────────────────────────────────────────────
// 查看弹窗：名称列点击打开，只读展示
// ──────────────────────────────────────────────────────────────
const viewModalOpen = ref(false);
const viewingRecord = ref(null);

function openViewModal(record) {
  viewingRecord.value = record;
  viewModalOpen.value = true;
}

function handleViewOpenChange(open) {
  viewModalOpen.value = open;
}

function closeViewModal() {
  viewModalOpen.value = false;
}
</script>

<template>
  <div class="tree-list-layout">
    <!-- 左侧分组树：点击节点即时筛选右侧列表，节点后括号为记录数 -->
    <a-card
      class="group-tree-card"
      title="分组层级"
      :body-style="{ padding: '11px 10px 10px' }"
    >
      <template #extra>
        <a-checkbox
          v-model:checked="includeChildren"
          @change="handleIncludeChange"
        >
          包含下级
        </a-checkbox>
      </template>
      <a-input
        v-model:value="treeKeyword"
        placeholder="请输入分组名称"
        allow-clear
        @change="handleTreeSearch"
      >
        <template #suffix>
          <SearchOutlined class="tree-search-icon" />
        </template>
      </a-input>
      <div class="group-tree-body">
        <a-tree
          :tree-data="treeData"
          :expanded-keys="expandedKeys"
          :selected-keys="selectedGroupKeys"
          block-node
          @expand="handleTreeExpand"
          @select="handleTreeSelect"
        >
          <template #title="{ key, title }">
            {{ title }}
            <span class="group-count">({{ groupCountMap[key] }})</span>
          </template>
        </a-tree>
        <!-- 「全部」常驻，空态只针对分组搜索无结果，显示在「全部」下方 -->
        <a-empty
          v-if="filteredTreeData.length === 0"
          :image="Empty.PRESENTED_IMAGE_SIMPLE"
          description="无匹配分组"
        />
      </div>
    </a-card>

    <!-- 右侧标准列表页结构：筛选卡 + 列表卡 -->
    <div class="page-stack tree-list-main">
      <!-- 一行放不下时由 FilterBar 提供展开/收起 - RB-032 -->
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
        </FilterBar>
      </a-card>

      <a-card :body-style="{ padding: '10px' }">
        <a-table
          :columns="columns"
          :data-source="filteredList"
          row-key="id"
          size="middle"
          :scroll="{ x: 810 }"
          :pagination="tablePagination"
          @change="handleTableChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'name'">
              <a class="link-cell" @click="openViewModal(record)">
                {{ record.name }}
              </a>
            </template>
            <!-- 显示完整路径，避免不同区域下同名节点无法区分 -->
            <template v-else-if="column.dataIndex === 'groupKey'">
              {{ groupPathMap[record.groupKey] }}
            </template>
            <!-- 本页不提供状态变更，状态仅作只读 Tag 展示 -->
            <template v-else-if="column.dataIndex === 'status'">
              <a-tag :color="statusColor(record.status)">
                {{ findEnumLabel(EXAMPLE_STATUS, record.status) }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <!-- 复用示例列表查看弹窗的框体样式，保证标题区与底部分隔线一致 -->
    <!-- FIX-003 修订：同一业务对象使用同一查看弹窗，标题与字段与示例列表一致 -->
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
      <!-- R2 P3-004 修订：关闭按钮放入右侧分区，与其他弹窗底部结构一致 -->
      <template #footer>
        <div class="modal-footer__right">
          <a-button @click="closeViewModal">关闭</a-button>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
/* 左树右表横向排布，两栏间距沿用页面分区 token，与上下卡片间距一致 */
.tree-list-layout {
  display: flex;
  align-items: stretch;
  gap: var(--page-section-gap);
}

/* 树卡片定宽；拉伸到与右侧同高，形成完整的左侧栏视觉 */
.group-tree-card {
  flex: 0 0 260px;
  width: 260px;
}

.group-tree-body {
  margin-top: 10px;
}

/* min-width: 0 允许右栏收缩，否则表格最小宽度会把整行撑出视口 */
.tree-list-main {
  flex: 1;
  min-width: 0;
}

.tree-search-icon {
  color: rgba(0, 0, 0, 0.45);
}

/* 计数弱化显示，不与节点名称争夺视觉层级 */
.group-count {
  margin-left: 2px;
  color: rgba(0, 0, 0, 0.45);
}

/* 窄屏改为上下排布，树卡片在列表上方占满宽度 */
@media (max-width: 992px) {
  .tree-list-layout {
    flex-direction: column;
  }

  .group-tree-card {
    flex: none;
    width: 100%;
  }
}
</style>
