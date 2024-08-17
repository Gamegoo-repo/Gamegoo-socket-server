class TreeNode {
  constructor(memberId, priorityValue) {
    this.memberId = memberId;
    this.priorityValue = priorityValue;
    this.left = null;
    this.right = null;
  }
}

// BST 구현
class PriorityTree {
  constructor() {
    this.root = null;
  }

  // 새로운 노드를 트리에 삽입
  insert(memberId, priorityValue) {

    const newNode = new TreeNode(memberId, priorityValue);
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  insertNode(node, newNode) {
    if (newNode.priorityValue < node.priorityValue) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }
  // root
  getMax(node) {
    if(node === null){
      return null;
    }

    if(node.right !== null){
      node = this.getMax(node.right);
    }
    return node;
  }

  getMaxbeforeNode(node,ExceptNode) {
    if(node === null){
      return null;
    }
    if(node.right !== null && node !== ExceptNode){
      node = this.getMax(node.right);
    }
    return node;
  }


  // 중위 순회로 정렬된 리스트를 반환
  inOrderTraverse(node, result = []) {
    if (node !== null) {
      this.inOrderTraverse(node.left, result);
      result.push({ memberId: node.memberId, priorityValue: node.priorityValue });
      this.inOrderTraverse(node.right, result);
    }
    return result;
  }

  // 트리의 정렬된 리스트를 반환
  getSortedList() {
    return this.inOrderTraverse(this.root);
  }
}

// PriorityTree.js
module.exports = {
  PriorityTree
};
