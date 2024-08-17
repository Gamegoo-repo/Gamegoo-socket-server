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

  // Node 삽입 로직
  insertNode(node, newNode) {
    if (newNode.priorityValue < node.priorityValue) {
      if (node.left === null) {
        node.left = newNode;
      } else {
        this.insertNode(node.left, newNode);
      }
    } else if (newNode.priorityValue > node.priorityValue) {
      if (node.right === null) {
        node.right = newNode;
      } else {
        this.insertNode(node.right, newNode);
      }
    } else {
      // priorityValue가 같은 경우 MemberId로 비교
      if (newNode.memberId < node.memberId) {
        if (node.left === null) {
          node.left = newNode;
        } else {
          this.insertNode(node.left, newNode);
        }
      } else if (newNode.memberId > node.memberId) {
        if (node.right === null) {
          node.right = newNode;
        } else {
          this.insertNode(node.right, newNode);
        }
      }
    }
  }

  // 트리 내 가장 priority가 높은 Node 찾기
  getMax(node) {
    if (node === null) {
      return null;
    }

    if (node.right !== null) {
      node = this.getMax(node.right);
    }
    return node;
  }

  // 트리 내에서 ExceptNode의 우선순위 값보다 작지만 가장 priority가 큰 노드 찾기
  getMaxBeforeNode(node, ExceptNode) {
    if (node === null) {
      return null;
    }
    if (node.right !== null && node !== ExceptNode) {
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

  // 특정 memberId가 트리에 존재하는지 확인
  contains(memberId) {
    return this.inOrderContains(this.root, memberId);
  }

  // 중위 순회로 특정 memberId가 있는지 확인하는 메서드
  inOrderContains(node, memberId) {
    if (node === null) {
      return false; // 노드가 없으면 false 반환
    }

    // 왼쪽 자식 노드 탐색
    if (this.inOrderContains(node.left, memberId)) {
      return true;
    }

    // 현재 노드가 찾는 memberId인지 확인
    if (node.memberId === memberId) {
      return true;
    }

    // 오른쪽 자식 노드 탐색
    return this.inOrderContains(node.right, memberId);
  }

  // 트리를 완전히 비우는 메서드
  clear() {
    this.root = null;
  }

  // 특정 memberId를 갖는 노드를 삭제
  removeByMemberId(memberId) {
    const { node, parent } = this.findNodeAndParent(this.root, null, memberId);
    if (!node) {
      return null; // 노드를 찾지 못하면 null 반환
    }
    this.removeNode(node, parent);
  }

  // 노드와 부모 노드를 찾는 메서드
  findNodeAndParent(node, parent, memberId) {
    if (node === null) {
      return { node: null, parent: null };
    }
    if (node.memberId === memberId) {
      return { node, parent };
    }
    if (node.left) {
      const leftResult = this.findNodeAndParent(node.left, node, memberId);
      if (leftResult.node) return leftResult;
    }
    if (node.right) {
      const rightResult = this.findNodeAndParent(node.right, node, memberId);
      if (rightResult.node) return rightResult;
    }
    return { node: null, parent: null };
  }

  // 노드를 삭제하는 메서드
  removeNode(node, parent) {
    if (node.left === null && node.right === null) { // 리프 노드인 경우
      if (node === this.root) {
        this.root = null;
      } else if (parent.left === node) {
        parent.left = null;
      } else {
        parent.right = null;
      }
    } else if (node.left === null || node.right === null) { // 자식이 하나인 경우
      const child = node.left || node.right;
      if (node === this.root) {
        this.root = child;
      } else if (parent.left === node) {
        parent.left = child;
      } else {
        parent.right = child;
      }
    } else { // 자식이 둘인 경우
      const successor = this.findMinNode(node.right);
      const successorMemberId = successor.memberId;
      const successorPriorityValue = successor.priorityValue;
      this.removeByMemberId(successor.memberId); // 후속 노드 삭제
      node.memberId = successorMemberId;
      node.priorityValue = successorPriorityValue;
    }
  }

  // 트리 내에서 가장 작은 값을 갖는 노드 찾기
  findMinNode(node) {
    if (node.left === null) {
      return node;
    } else {
      return this.findMinNode(node.left);
    }
  }


}

// PriorityTree.js
module.exports = {
  PriorityTree
};
