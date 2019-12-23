import axios from 'axios';

export default {
  getAll: async () => {
    let res = await axios.get(`/api/story`);
    return res.data || [];
  },
  getByTitle: async (title) => {
    let res = await axios.get(`/api/story/` + title);
    return res.data || [];
  }
}
