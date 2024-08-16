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
      if (newNode.priorityValue > this.root.priorityValue) {
        // 가장 큰 값을 가진 노드가 루트가 되도록
        this.root = newNode;
      }
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

  getMax() {
    return this.root ? { memberId: this.root.memberId, priorityValue: this.root.priorityValue } : null;
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
