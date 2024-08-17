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

  insert(memberId, priorityValue) {
    const newNode = new TreeNode(memberId, priorityValue);
    if (this.root === null) {
      this.root = newNode;
    } else {
      this.insertNode(this.root, newNode);
    }
  }

  insertNode(node, newNode) {
    // 새로운 노드가 기존 노드보다 더 작으면 왼쪽으로
    if (newNode.priorityValue < node.priorityValue) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else { 
    // 새로운 노드가 기존 노드보다 더 크면 오른쪽으로 
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    }
  }

  // root
  getMax(node) {
    if(node.right !== null){
      node = this.getMax(node.right);
    }
    return node;
  }

  inOrderTraverse(node, result = []) {
    if (node !== null) {
      this.inOrderTraverse(node.left, result);
      result.push({ memberId: node.memberId, priorityValue: node.priorityValue });
      this.inOrderTraverse(node.right, result);
    }
    return result;
  }

  getSortedList() {
    return this.inOrderTraverse(this.root);
  }
}

// PriorityTree.js
module.exports = {
  PriorityTree
};
