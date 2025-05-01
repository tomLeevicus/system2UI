import { ref } from "vue";

const useTable = () => {
  const paginationConfig = ref({
    current: 1,
    size: 20,
  });

  return {
    paginationConfig,
  };
};

export default useTable;
